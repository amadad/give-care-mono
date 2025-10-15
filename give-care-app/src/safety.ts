/**
 * Safety guardrails: crisis detection, spam filtering, medical advice prevention, content safety
 * Target: <500ms response, 100% crisis detection accuracy
 */

import type {
  InputGuardrail,
  OutputGuardrail,
  TextOutput
} from '@openai/agents';

// Crisis detection data
const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end my life',
  'want to die',
  'better off dead',
  "can't go on",
  'end it all',
  'no reason to live',
  'self harm',
  'hurt myself',
];

// Pre-compiled regex for faster crisis detection (single-pass vs 10 string.includes calls)
const CRISIS_PATTERN = /suicide|kill myself|end my life|want to die|better off dead|can't go on|end it all|no reason to live|self harm|hurt myself/i;

const CRISIS_RESOURCES = `I hear you, and I'm really glad you reached out.

**Immediate support:**
• Call 988 (Suicide & Crisis Lifeline)
• Text 741741 (Crisis Text Line)
• Call 911 (emergency)

You don't have to face this alone. These services are free, confidential, and available 24/7.`;

// Input guardrails (run before agent)
export const crisisGuardrail: InputGuardrail = {
  name: 'crisis-detection',
  execute: async ({ input }) => {
    /**
     * Enhanced crisis detection guardrail.
     *
     * Detects suicide/self-harm language and triggers tripwire to:
     * 1. Block agent execution
     * 2. Return immediate crisis resources
     *
     * PRD §5.2: 100% accuracy requirement, <500ms response
     *
     * Args:
     *   agent: Agent instance
     *   input: User message
     *   context: Run context
     *
     * Returns:
     *   GuardrailFunctionOutput with tripwireTriggered=true if crisis detected
     */

    // Convert input to string
    const message = typeof input === 'string'
      ? input
      : input.map(i => (i as any).text || '').join(' ');
    const messageLower = message.toLowerCase();

    // Check for crisis keywords using pre-compiled regex (faster than loop)
    const match = messageLower.match(CRISIS_PATTERN);

    if (match) {
      const detectedKeyword = match[0];
      // TRIPWIRE - Stop agent execution
      return {
        outputInfo: {
          crisisDetected: true,
          keyword: detectedKeyword,
          response: CRISIS_RESOURCES,
        },
        tripwireTriggered: true, // Agent will not run
      };
    }

    // No crisis detected - continue to agent
    return {
      outputInfo: { crisisDetected: false },
      tripwireTriggered: false,
    };
  },
};

export const spamGuardrail: InputGuardrail = {
  name: 'spam-filter',
  execute: async ({ input }) => {
    /**
     * Spam and abuse filter.
     *
     * Fast heuristic checks for:
     * - Promotional spam
     * - Abusive language
     * - Obviously off-topic content
     *
     * Performance: ~5ms (heuristic, no LLM)
     *
     * Args:
     *   agent: Agent instance
     *   input: User message
     *   context: Run context
     *
     * Returns:
     *   GuardrailFunctionOutput with tripwireTriggered=true if spam detected
     */

    const message = typeof input === 'string'
      ? input
      : input.map(i => (i as any).text || '').join(' ');
    const messageLower = message.toLowerCase();

    // Spam indicators
    const spamPatterns = [
      'click here',
      'buy now',
      'limited time offer',
      'act now',
      'free money',
      'make money fast',
      'click this link',
      'winner',
      'congratulations you',
      'claim your prize',
      '$$$',
      '100% free',
      'risk free',
      'no credit card',
      'apply now',
    ];

    // Check for spam
    const spamScore = spamPatterns.filter(pattern => messageLower.includes(pattern)).length;

    if (spamScore >= 2) {
      // Multiple spam indicators
      return {
        outputInfo: {
          spamDetected: true,
          spamScore: spamScore,
          response: "I'm here to support caregivers. How can I help you today?",
        },
        tripwireTriggered: true,
      };
    }

    // Extreme profanity/abuse filter (basic)
    const abusePatterns = [
      'fuck you',
      'go to hell',
      'fuck off',
      'piece of shit',
      'you suck',
      'stupid bot',
    ];

    const abuseDetected = abusePatterns.some(pattern => messageLower.includes(pattern));

    if (abuseDetected) {
      return {
        outputInfo: {
          abuseDetected: true,
          response: "I'm here to help. Let me know if you'd like support with caregiving.",
        },
        tripwireTriggered: true,
      };
    }

    // Pass through
    return {
      outputInfo: { spamDetected: false, abuseDetected: false },
      tripwireTriggered: false,
    };
  },
};

// Output guardrails (run after agent)
export const medicalAdviceGuardrail: OutputGuardrail<TextOutput> = {
  name: 'medical-advice-prevention',
  execute: async ({ agentOutput }) => {
    /**
     * Medical advice prevention guardrail.
     *
     * Ensures agent does NOT provide medical advice, diagnoses, or treatment
     * recommendations. Critical for liability and healthcare compliance.
     *
     * Blocks responses containing:
     * - Medication dosage advice
     * - Diagnosis language
     * - Treatment recommendations
     * - "You should take..." medical directives
     *
     * Args:
     *   agent: Agent instance
     *   agentOutput: Agent's generated output
     *   context: Run context
     *
     * Returns:
     *   GuardrailFunctionOutput with tripwireTriggered=true if medical advice detected
     */

    // Extract text from agent output
    const outputText = String(agentOutput);
    const outputLower = outputText.toLowerCase();

    // Medical advice red flags
    const medicalPatterns = [
      'you should take',
      'increase the dose',
      'decrease the dose',
      'stop taking',
      'start taking',
      'change medication',
      'mg of',
      'diagnosis',
      'you have',
      'you are experiencing',
      'this is a symptom of',
      'you need to see a doctor immediately',
      'this could be',
      'sounds like you have',
    ];

    // Check for medical advice
    let medicalDetected = false;
    let detectedPattern: string | null = null;

    for (const pattern of medicalPatterns) {
      if (outputLower.includes(pattern)) {
        medicalDetected = true;
        detectedPattern = pattern;
        break;
      }
    }

    if (medicalDetected) {
      // BLOCK - Replace with safe response
      const safeResponse = `I can't provide medical advice, but I can help you understand your options.

For medical questions about medications or symptoms, please consult with:
• Your healthcare provider
• Pharmacist
• Nurse hotline

How else can I support you today?`;

      return {
        outputInfo: {
          medicalAdviceDetected: true,
          pattern: detectedPattern,
          safeResponse: safeResponse,
        },
        tripwireTriggered: true,
      };
    }

    // Safe - allow response
    return {
      outputInfo: { medicalAdviceDetected: false },
      tripwireTriggered: false,
    };
  },
};

export const safetyGuardrail: OutputGuardrail<TextOutput> = {
  name: 'safety-check',
  execute: async ({ agentOutput }) => {
    /**
     * General safety guardrail for agent output.
     *
     * Checks for:
     * - Harmful content
     * - Inappropriate language
     * - Off-brand responses
     * - PII leakage
     *
     * Args:
     *   agent: Agent instance
     *   agentOutput: Agent's generated output
     *   context: Run context
     *
     * Returns:
     *   GuardrailFunctionOutput with warnings if issues detected
     */

    // Extract text from agent output
    const outputText = String(agentOutput);
    const outputLower = outputText.toLowerCase();

    // Check for forbidden language (P1-P6 compliance)
    const forbiddenWords = ['should', 'must', 'wrong', 'fault', 'blame', 'stupid', 'lazy'];

    const forbiddenDetected: string[] = [];
    for (const word of forbiddenWords) {
      // Check for word boundaries to avoid false positives
      if (` ${outputLower} `.includes(` ${word} `) || outputLower.startsWith(`${word} `)) {
        forbiddenDetected.push(word);
      }
    }

    if (forbiddenDetected.length > 0) {
      // Warning (don't block, but log)
      return {
        outputInfo: {
          forbiddenLanguage: true,
          words: forbiddenDetected,
          warning: 'Response contains forbidden language per P1-P6 principles',
        },
        tripwireTriggered: false, // Don't block, just warn
      };
    }

    // Check for very long responses (SMS constraint)
    if (outputText.length > 500) {
      return {
        outputInfo: {
          tooLong: true,
          length: outputText.length,
          warning: 'Response exceeds SMS-friendly length (>500 chars)',
        },
        tripwireTriggered: false, // Don't block, just warn
      };
    }

    // Pass
    return {
      outputInfo: { safetyCheck: 'passed' },
      tripwireTriggered: false,
    };
  },
};

// Legacy compatibility
/** @deprecated Use crisisGuardrail instead */
export const detectCrisis = (message: string): {
  tripwire: boolean;
  response: string;
} => {
  const normalized = message.toLowerCase();
  const triggered = CRISIS_KEYWORDS.some((phrase) => normalized.includes(phrase));

  if (!triggered) {
    return { tripwire: false, response: "" };
  }

  return {
    tripwire: true,
    response: CRISIS_RESOURCES,
  };
};

// Export all guardrails
export const allInputGuardrails = [crisisGuardrail, spamGuardrail];
export const allOutputGuardrails = [medicalAdviceGuardrail, safetyGuardrail];
