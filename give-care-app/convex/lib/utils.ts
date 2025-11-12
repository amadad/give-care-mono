/**
 * Utility functions for GiveCare
 * Crisis detection, profile extraction, and helper functions
 */

// Crisis keyword patterns (19+ keywords across 3 severity levels)
const CRISIS_PATTERNS = {
  high: [
    /\bkill\s+myself\b/i,
    /\bsuicide\b/i,
    /\bend\s+my\s+life\b/i,
    /\bcan't\s+go\s+on\b/i,
    /\boverdose\b/i,
  ],
  medium: [
    /\bhurt\s+myself\b/i,
    /\bself[- ]?harm\b/i,
    /\bhopeless\b/i,
    /\bdone\s+with\s+life\b/i,
  ],
  low: [/\bpanic\s+attack\b/i],
};

// False-positive patterns (subscription-related, should route to STOP handler)
const FALSE_POSITIVE_PATTERNS = [
  /\bend\s+my\s+subscription\b/i,
  /\bcancel\s+my\s+account\b/i,
  /\bunsubscribe\b/i,
  /\bstop\s+my\s+subscription\b/i,
];

// DV/Abuse hint patterns
const DV_HINT_PATTERNS = [
  /\b(he|she|they)'ll\s+kill\s+me\b/i,
  /\b(he|she|they)'ll\s+hurt\s+me\b/i,
  /\b(he|she|they)'ll\s+abuse\s+me\b/i,
];

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity?: "high" | "medium" | "low";
  isFalsePositive: boolean;
  isDVHint: boolean;
}

/**
 * Detect crisis keywords in message text
 * Returns detection result with severity and false-positive checks
 */
export function detectCrisis(text: string): CrisisDetectionResult {
  // Check for false positives first (subscription-related)
  const isFalsePositive = FALSE_POSITIVE_PATTERNS.some((pattern) =>
    pattern.test(text)
  );

  if (isFalsePositive) {
    return {
      isCrisis: false,
      isFalsePositive: true,
      isDVHint: false,
    };
  }

  // Check for DV/abuse hints
  const isDVHint = DV_HINT_PATTERNS.some((pattern) => pattern.test(text));

  // Check crisis patterns (high priority first)
  for (const [severity, patterns] of Object.entries(CRISIS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return {
          isCrisis: true,
          severity: severity as "high" | "medium" | "low",
          isFalsePositive: false,
          isDVHint,
        };
      }
    }
  }

  return {
    isCrisis: false,
    isFalsePositive: false,
    isDVHint,
  };
}

/**
 * Check if message is a STOP request
 */
export function isStopRequest(text: string): boolean {
  const stopPatterns = [
    /\bstop\b/i,
    /\bunsubscribe\b/i,
    /\bcancel\b/i,
    /\bopt\s+out\b/i,
  ];
  return stopPatterns.some((pattern) => pattern.test(text));
}

/**
 * Check if message is a HELP request
 */
export function isHelpRequest(text: string): boolean {
  const helpPatterns = [/\bhelp\b/i, /\binfo\b/i, /\bsupport\b/i];
  return helpPatterns.some((pattern) => pattern.test(text));
}

/**
 * Check if message is a RESUBSCRIBE request
 */
export function isResubscribeRequest(text: string): boolean {
  const resubscribePatterns = [/\bresubscribe\b/i];
  return resubscribePatterns.some((pattern) => pattern.test(text));
}

/**
 * Check if user is accepting an assessment offer
 */
export function isAssessmentAcceptance(text: string): boolean {
  const acceptPatterns = [
    /\b(yes|ok|sure|yeah|yep|alright|okay)\b/i,
    /\bstart\b/i,
    /\bgo\b/i,
    /\blet'?s\s+go\b/i,
  ];
  return acceptPatterns.some((pattern) => pattern.test(text));
}

/**
 * Extract care recipient information from text
 */
export function extractCareRecipient(
  text: string
): { recipient?: string; condition?: string } {
  // Simple extraction patterns
  const recipientPatterns = [
    /\b(my\s+)?(mom|mother|mama|mum)\b/i,
    /\b(my\s+)?(dad|father|papa|pop)\b/i,
    /\b(my\s+)?(spouse|husband|wife|partner)\b/i,
    /\b(my\s+)?(son|daughter|child|kid)\b/i,
    /\b(my\s+)?(sister|brother|sibling)\b/i,
  ];

  const conditionPatterns = [
    /\bAlzheimer'?s\b/i,
    /\bdementia\b/i,
    /\bcancer\b/i,
    /\bdiabetes\b/i,
    /\bheart\s+disease\b/i,
    /\bstroke\b/i,
  ];

  let recipient: string | undefined;
  let condition: string | undefined;

  for (const pattern of recipientPatterns) {
    const match = text.match(pattern);
    if (match) {
      recipient = match[0].replace(/^my\s+/i, "").toLowerCase();
      break;
    }
  }

  for (const pattern of conditionPatterns) {
    const match = text.match(pattern);
    if (match) {
      condition = match[0];
      break;
    }
  }

  return { recipient, condition };
}

/**
 * Get crisis response template
 * All severities get same template (per plan)
 */
export function getCrisisResponse(isDVHint: boolean): string {
  const baseResponse =
    "I'm hearing intense distress. You're not alone. Call or text 988 (24/7) or chat at 988lifeline.org. Text HOME to 741741. If in immediate danger, call 911. Want me to connect you now?";

  if (isDVHint) {
    return `${baseResponse} If you can't safely reply, call 911.`;
  }

  return baseResponse;
}
