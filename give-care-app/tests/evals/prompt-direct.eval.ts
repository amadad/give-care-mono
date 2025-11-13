/**
 * Direct Prompt Testing with Evalite
 * 
 * This file shows how to test prompts directly using AI SDK with tracing,
 * without going through Convex agents. Useful for prompt engineering.
 * 
 * Run with: evalite watch
 * 
 * NOTE: Requires GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable.
 * Loads from .env.local file automatically.
 * Uses Gemini gemini-2.5-flash-lite model (same as production).
 * If not set, this eval will be skipped.
 */

// Load .env.local explicitly (Evalite doesn't auto-load it)
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Get the directory of this file, then resolve .env.local relative to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Go up from tests/evals/ to give-care-app/ root
const projectRoot = resolve(__dirname, '../..');
const envLocalPath = resolve(projectRoot, '.env.local');
const envPath = resolve(projectRoot, '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log('✅ Loaded .env.local');
} else if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('✅ Loaded .env');
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

// Skip if API key not available - use empty eval to prevent errors
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not set. Skipping prompt-direct.eval.ts');
  evalite('Trauma-Informed Prompt Testing (Skipped)', {
    data: async () => [],
    async task() {
      return 'API key not configured';
    },
    scorers: [],
  });
} else {
  // Test prompt variations for trauma-informed caregiving responses
  evalite('Trauma-Informed Prompt Testing', {
    data: async () => [
      {
        input: 'I am so overwhelmed and stressed',
        expected: {
          groundTruth: [
            'Response acknowledges the caregiver\'s feelings before offering solutions',
            'Response validates the stress and overwhelm',
            'Response offers concrete help or resources',
            'Response follows P1 principle (acknowledge before answer)',
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
      {
        input: 'My mom forgot to take her medication again',
        expected: {
          groundTruth: [
            'Response is empathetic and non-judgmental',
            'Response offers practical solutions',
            'Response validates the caregiver\'s concern',
          ],
        },
      },
    ],

    async task(input: string) {
      // Test the prompt directly with AI SDK using Gemini
      const result = await streamText({
        model: traceAISDKModel(google('gemini-2.5-flash-lite')),
        system: `You are GiveCare Main Agent – an SMS companion for family caregivers.

Think briefly about what the caregiver needs, then respond.

P1 Acknowledge feelings before answering.
P2 Never repeat the same question within a session.
P3 Offer skip after two attempts.
P4 Use soft confirmations ("Got it: Sarah, right?").
P5 Skip is always available (users can defer any request, but you don't need to state it explicitly).
P6 Deliver value every turn (validation, resource, tip, or progress).

- You respond in <= 160 characters unless sharing resources.
- One question at a time.
- Only mention skip explicitly when contextually appropriate (e.g., during onboarding or after 2 attempts).
- If the user seems in crisis, escalate immediately.`,
        prompt: input,
      });

      return await result.text;
    },

    scorers: [
      // Keyword-based faithfulness scorer (avoids rate limits)
      {
        name: 'Faithfulness (Keywords)',
        scorer: ({ input, output, expected }) => {
          const text = String(output || '').toLowerCase();
          const groundTruth = expected?.groundTruth || [];
          
          if (groundTruth.length === 0) return 0.5; // Neutral if no ground truth
          
          let matches = 0;
          for (const truth of groundTruth) {
            const lowerTruth = truth.toLowerCase();
            
            // Check for key phrases
            if (lowerTruth.includes('acknowledge') && (
              text.includes('understand') || text.includes('hear') || text.includes('feel')
            )) matches++;
            
            if (lowerTruth.includes('validate') && (
              text.includes('understand') || text.includes('hear') || text.includes('feel') || text.includes('stress')
            )) matches++;
            
            if (lowerTruth.includes('resource') && (
              text.includes('resource') || text.includes('support') || text.includes('help') || text.includes('find')
            )) matches++;
            
            if (lowerTruth.includes('empathetic') && (
              text.includes('understand') || text.includes('sorry') || text.includes('feel')
            )) matches++;
            
            if (lowerTruth.includes('practical') && (
              text.includes('can') || text.includes('help') || text.includes('try')
            )) matches++;
          }
          
          return Math.min(1, matches / Math.max(groundTruth.length, 1));
        },
      },
      
      // Keyword-based relevancy scorer (avoids rate limits)
      {
        name: 'Answer Relevancy (Keywords)',
        scorer: ({ input, output }) => {
          const question = String(input || '').toLowerCase();
          const answer = String(output || '').toLowerCase();
          
          // Check if answer contains keywords from the question
          const questionWords = question.split(/\s+/).filter(w => w.length > 3);
          const matchingWords = questionWords.filter(word => answer.includes(word));
          
          // Also check for common response patterns
          const hasResponsePattern = answer.length > 10 && (
            answer.includes('help') || answer.includes('support') || answer.includes('can')
          );
          
          return Math.min(1, (matchingWords.length / Math.max(questionWords.length, 1)) * 0.7 + (hasResponsePattern ? 0.3 : 0));
        },
      },
      
      // Check if response contains acknowledgment keywords (P1 principle)
      {
        name: 'P1 - Acknowledges Feelings',
        scorer: ({ output }) => {
          const text = String(output || '').toLowerCase();
          const keywords = ['understand', 'hear', 'feel', 'sorry'];
          return keywords.some(keyword => text.includes(keyword)) ? 1.0 : 0.0;
        },
      },
      
      // Check if response offers help (P6 principle)
      {
        name: 'P6 - Offers Help',
        scorer: ({ output }) => {
          const text = String(output || '').toLowerCase();
          const keywords = ['can', 'help', 'resource', 'tip', 'support'];
          return keywords.some(keyword => text.includes(keyword)) ? 1.0 : 0.0;
        },
      },
      
      // Check if response includes skip option (P5 principle)
      {
        name: 'P5 - Has Skip Option',
        scorer: ({ output }) => {
          const text = String(output || '').toLowerCase();
          return text.includes('skip') ? 1.0 : 0.0;
        },
      },
      
      // SMS-friendly length scorer
      {
        name: 'SMS Length (<=160 chars)',
        scorer: ({ output }) => {
          const text = String(output || '');
          const length = text.length;
          if (length <= 160) return 1.0;
          if (length <= 200) return 0.5;
          return Math.max(0, 1 - (length - 200) / 100);
        },
      },
    ],
  });
}
