/**
 * A/B Testing Different Prompt Variations
 * 
 * Compare different prompt styles side-by-side to see which performs better.
 * 
 * Based on: https://v1.evalite.dev/tips/a-b-testing
 * 
 * Run with: pnpm test:eval
 */

// Load .env.local
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');
const envLocalPath = resolve(projectRoot, '.env.local');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { evalite } from 'evalite';
import { traceAISDKModel } from 'evalite/ai-sdk';

// Custom faithfulness scorer that works with Gemini (avoids structured output enum issues)
async function faithfulnessScorer({
  question,
  answer,
  groundTruth,
  model,
}: {
  question: string;
  answer: string;
  groundTruth: string[];
  model: ReturnType<typeof google>;
}): Promise<number> {
  const result = await streamText({
    model: traceAISDKModel(model),
    prompt: `Evaluate how well the answer aligns with the ground truth statements.

Question: ${question}

Answer: ${answer}

Ground Truth Statements:
${groundTruth.map((gt, i) => `${i + 1}. ${gt}`).join('\n')}

Rate the faithfulness on a scale of 0.0 to 1.0, where:
- 1.0 = Answer perfectly aligns with all ground truth statements
- 0.5 = Answer partially aligns with some ground truth statements
- 0.0 = Answer does not align with ground truth statements

Respond with ONLY a number between 0.0 and 1.0 (e.g., "0.85"):`,
  });

  const text = await result.text;
  const match = text.match(/(\d+\.?\d*)/);
  if (match) {
    const score = parseFloat(match[1]);
    return Math.max(0, Math.min(1, score / (score > 1 ? 100 : 1))); // Handle both 0-1 and 0-100 scales
  }
  return 0.5; // Default to neutral if parsing fails
}

// Custom answer relevancy scorer that works with Gemini
async function answerRelevancyScorer({
  question,
  answer,
  model,
}: {
  question: string;
  answer: string;
  model: ReturnType<typeof google>;
}): Promise<number> {
  const result = await streamText({
    model: traceAISDKModel(model),
    prompt: `Evaluate how relevant the answer is to the question.

Question: ${question}

Answer: ${answer}

Rate the relevancy on a scale of 0.0 to 1.0, where:
- 1.0 = Answer is highly relevant and directly addresses the question
- 0.5 = Answer is somewhat relevant but partially off-topic
- 0.0 = Answer is not relevant to the question

Respond with ONLY a number between 0.0 and 1.0 (e.g., "0.90"):`,
  });

  const text = await result.text;
  const match = text.match(/(\d+\.?\d*)/);
  if (match) {
    const score = parseFloat(match[1]);
    return Math.max(0, Math.min(1, score / (score > 1 ? 100 : 1))); // Handle both 0-1 and 0-100 scales
  }
  return 0.5; // Default to neutral if parsing fails
}

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not set. Skipping prompt-ab-test.eval.ts');
  evalite('A/B Prompt Testing (Skipped)', {
    data: async () => [],
    async task() {
      return 'API key not configured';
    },
    scorers: [],
  });
} else {
  // Test two different prompt styles
  const promptA = `You are GiveCare Main Agent – an SMS companion for family caregivers.

Think briefly about what the caregiver needs, then respond.

P1 Acknowledge feelings before answering.
P2 Never repeat the same question within a session.
P3 Offer skip after two attempts.
P4 Use soft confirmations ("Got it: Sarah, right?").
P5 Give a skip option on every ask.
P6 Deliver value every turn (validation, resource, tip, or progress).

- You respond in <= 160 characters unless sharing resources.
- One question at a time; every ask ends with (Reply "skip" to move on).
- If the user seems in crisis, escalate immediately.`;

  const promptB = `You are a compassionate caregiver support assistant. Your role is to:

1. Listen and validate feelings first (trauma-informed approach)
2. Offer practical, actionable help
3. Keep responses brief (SMS-friendly, under 160 chars)
4. Always end questions with "(Reply 'skip' to move on)"

When caregivers reach out, acknowledge their emotions, then provide concrete support.`;

  evalite('Prompt A vs Prompt B - Trauma-Informed Care', {
    data: async () => [
      // Reduced to 2 test cases to avoid rate limits (2 cases × 2 prompts = 4 API calls)
      {
        input: 'I am so overwhelmed and stressed',
        expected: {
          groundTruth: [
            'Response acknowledges feelings before offering solutions',
            'Response validates the stress and overwhelm',
            'Response offers concrete help or resources',
          ],
        },
      },
      {
        input: 'I need help finding a support group',
        expected: {
          groundTruth: [
            'Response offers to help find resources',
            'Response mentions support groups or local resources',
            'Response is actionable and helpful',
          ],
        },
      },
      // Removed 3rd test case to stay under Gemini free tier limit (15 req/min)
      // Total API calls: prompt-direct (3) + prompt-ab-test (2×2=4) = 7 calls
    ],

    async task(input: string) {
      // Run both prompts and return comparison using Gemini
      const [resultA, resultB] = await Promise.all([
        streamText({
          model: traceAISDKModel(google('gemini-2.5-flash-lite')),
          system: promptA,
          prompt: input,
        }),
        streamText({
          model: traceAISDKModel(google('gemini-2.5-flash-lite')),
          system: promptB,
          prompt: input,
        }),
      ]);

      return {
        promptA: await resultA.text,
        promptB: await resultB.text,
      };
    },

    scorers: [
      // Keyword-based faithfulness scorer for Prompt A (avoids rate limits)
      {
        name: 'Prompt A - Faithfulness (Keywords)',
        scorer: ({ input, output, expected }) => {
          const text = String(output?.promptA || '').toLowerCase();
          const groundTruth = expected?.groundTruth || [];
          
          if (groundTruth.length === 0) return 0.5;
          
          let matches = 0;
          for (const truth of groundTruth) {
            const lowerTruth = truth.toLowerCase();
            if (lowerTruth.includes('acknowledge') && (text.includes('understand') || text.includes('hear') || text.includes('feel'))) matches++;
            if (lowerTruth.includes('validate') && (text.includes('understand') || text.includes('hear') || text.includes('feel') || text.includes('stress'))) matches++;
            if (lowerTruth.includes('resource') && (text.includes('resource') || text.includes('support') || text.includes('help') || text.includes('find'))) matches++;
            if (lowerTruth.includes('empathetic') && (text.includes('understand') || text.includes('sorry') || text.includes('feel'))) matches++;
            if (lowerTruth.includes('practical') && (text.includes('can') || text.includes('help') || text.includes('try'))) matches++;
          }
          
          return Math.min(1, matches / Math.max(groundTruth.length, 1));
        },
      },
      // Keyword-based faithfulness scorer for Prompt B (avoids rate limits)
      {
        name: 'Prompt B - Faithfulness (Keywords)',
        scorer: ({ input, output, expected }) => {
          const text = String(output?.promptB || '').toLowerCase();
          const groundTruth = expected?.groundTruth || [];
          
          if (groundTruth.length === 0) return 0.5;
          
          let matches = 0;
          for (const truth of groundTruth) {
            const lowerTruth = truth.toLowerCase();
            if (lowerTruth.includes('acknowledge') && (text.includes('understand') || text.includes('hear') || text.includes('feel'))) matches++;
            if (lowerTruth.includes('validate') && (text.includes('understand') || text.includes('hear') || text.includes('feel') || text.includes('stress'))) matches++;
            if (lowerTruth.includes('resource') && (text.includes('resource') || text.includes('support') || text.includes('help') || text.includes('find'))) matches++;
            if (lowerTruth.includes('empathetic') && (text.includes('understand') || text.includes('sorry') || text.includes('feel'))) matches++;
            if (lowerTruth.includes('practical') && (text.includes('can') || text.includes('help') || text.includes('try'))) matches++;
          }
          
          return Math.min(1, matches / Math.max(groundTruth.length, 1));
        },
      },
      // Keyword-based relevancy for Prompt A (avoids rate limits)
      {
        name: 'Prompt A - Relevancy (Keywords)',
        scorer: ({ input, output }) => {
          const question = String(input || '').toLowerCase();
          const answer = String(output?.promptA || '').toLowerCase();
          const questionWords = question.split(/\s+/).filter(w => w.length > 3);
          const matchingWords = questionWords.filter(word => answer.includes(word));
          const hasResponsePattern = answer.length > 10 && (answer.includes('help') || answer.includes('support') || answer.includes('can'));
          return Math.min(1, (matchingWords.length / Math.max(questionWords.length, 1)) * 0.7 + (hasResponsePattern ? 0.3 : 0));
        },
      },
      // Keyword-based relevancy for Prompt B (avoids rate limits)
      {
        name: 'Prompt B - Relevancy (Keywords)',
        scorer: ({ input, output }) => {
          const question = String(input || '').toLowerCase();
          const answer = String(output?.promptB || '').toLowerCase();
          const questionWords = question.split(/\s+/).filter(w => w.length > 3);
          const matchingWords = questionWords.filter(word => answer.includes(word));
          const hasResponsePattern = answer.length > 10 && (answer.includes('help') || answer.includes('support') || answer.includes('can'));
          return Math.min(1, (matchingWords.length / Math.max(questionWords.length, 1)) * 0.7 + (hasResponsePattern ? 0.3 : 0));
        },
      },
      // Check if Prompt A includes skip option
      {
        name: 'Prompt A - Has Skip Option',
        scorer: ({ output }) => {
          const text = String(output?.promptA || '').toLowerCase();
          return text.includes('skip') ? 1.0 : 0.0;
        },
      },
      // Check if Prompt B includes skip option
      {
        name: 'Prompt B - Has Skip Option',
        scorer: ({ output }) => {
          const text = String(output?.promptB || '').toLowerCase();
          return text.includes('skip') ? 1.0 : 0.0;
        },
      },
      // SMS length check for Prompt A
      {
        name: 'Prompt A - SMS Length (<=160)',
        scorer: ({ output }) => {
          const text = String(output?.promptA || '');
          const length = text.length;
          return length <= 160 ? 1.0 : Math.max(0, 1 - (length - 160) / 100);
        },
      },
      // SMS length check for Prompt B
      {
        name: 'Prompt B - SMS Length (<=160)',
        scorer: ({ output }) => {
          const text = String(output?.promptB || '');
          const length = text.length;
          return length <= 160 ? 1.0 : Math.max(0, 1 - (length - 160) / 100);
        },
      },
    ],
  });
}

