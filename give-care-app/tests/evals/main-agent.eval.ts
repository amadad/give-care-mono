/**
 * Evalite Tests for Main Agent
 * 
 * ⚠️ KNOWN ISSUE: Component registration doesn't work in Evalite's isolated environment
 * 
 * This file is currently skipped because Evalite creates isolated test instances
 * where Convex component registration doesn't persist to action execution context.
 * 
 * WORKAROUND: Use `prompt-direct.eval.ts` for prompt testing (no Convex overhead)
 * For full agent testing, use regular Vitest: `npm test -- simulation`
 * 
 * Run with: evalite watch
 * Opens interactive UI at http://localhost:3006
 * 
 * These tests let you visually explore agent responses, compare prompts,
 * and debug AI behavior in real-time.
 * 
 * Uses Evalite's built-in scorers and tracing capabilities.
 */

// Skip this eval - component registration doesn't work in Evalite
// See: tests/evals/ROOT_CAUSE.md for details
import { evalite } from 'evalite';

evalite('Main Agent - Caregiving Support (SKIPPED)', {
  data: async () => [],
  async task() {
    return 'Skipped: Component registration issue in Evalite. Use prompt-direct.eval.ts or npm test -- simulation';
  },
  scorers: [],
});

/* ORIGINAL CODE - DISABLED DUE TO COMPONENT REGISTRATION ISSUE
import { api } from '../../convex/_generated/api';
import { initConvexTest } from '../../convex/setup.test';

// Helper to create test context
function createTestContext(userId: string, metadata?: Record<string, unknown>) {
  return {
    userId,
    sessionId: `test-session-${Date.now()}`,
    locale: 'en-US',
    consent: { emergency: true, marketing: false },
    metadata: {
      profile: {
        firstName: 'Alice',
        careRecipientName: 'Mom',
      },
      journeyPhase: 'active',
      totalInteractionCount: 5,
      ...metadata,
    },
  };
}

// Test data - different caregiver scenarios with ground truth expectations
const testCases = async () => [
  {
    input: 'Hi, I need help',
    expected: {
      groundTruth: [
        'Agent greets warmly and offers help',
        'Response includes greeting words like hi, hello, or support',
        'Agent acknowledges need for help',
      ],
    },
  },
  {
    input: 'I need to find a support group near me',
    expected: {
      groundTruth: [
        'Agent offers to help find resources',
        'Response mentions support groups or resources',
        'Agent uses searchResources tool',
      ],
    },
  },
  {
    input: 'I am so overwhelmed and stressed',
    expected: {
      groundTruth: [
        'Agent acknowledges feelings (P1 principle)',
        'Agent validates stress/overwhelm',
        'Agent offers concrete help (P6 principle)',
      ],
    },
  },
  {
    input: 'My mom prefers her medication at 8am every morning',
    expected: {
      groundTruth: [
        'Agent acknowledges the information',
        'Agent uses recordMemory tool',
        'Response confirms memory was saved',
      ],
    },
  },
  {
    input: 'ok',
    expected: {
      groundTruth: [
        'Agent provides meaningful response despite short input',
        'Response is longer than 10 characters',
        'Agent uses fast path for short inputs',
      ],
    },
  },
];

// Helper to create test context
function createTestContext(userId: string, metadata?: Record<string, unknown>) {
  return {
    userId,
    sessionId: `test-session-${Date.now()}`,
    locale: 'en-US',
    consent: { emergency: true, marketing: false },
    metadata: {
      profile: {
        firstName: 'Alice',
        careRecipientName: 'Mom',
      },
      journeyPhase: 'active',
      totalInteractionCount: 5,
      ...metadata,
    },
  };
}

// Test data - different caregiver scenarios with ground truth expectations
const testCases = async () => [
  {
    input: 'Hi, I need help',
    expected: {
      groundTruth: [
        'Agent greets warmly and offers help',
        'Response includes greeting words like hi, hello, or support',
        'Agent acknowledges need for help',
      ],
    },
  },
  {
    input: 'I need to find a support group near me',
    expected: {
      groundTruth: [
        'Agent offers to help find resources',
        'Response mentions support groups or resources',
        'Agent uses searchResources tool',
      ],
    },
  },
  {
    input: 'I am so overwhelmed and stressed',
    expected: {
      groundTruth: [
        'Agent acknowledges feelings (P1 principle)',
        'Agent validates stress/overwhelm',
        'Agent offers concrete help (P6 principle)',
      ],
    },
  },
  {
    input: 'My mom prefers her medication at 8am every morning',
    expected: {
      groundTruth: [
        'Agent acknowledges the information',
        'Agent uses recordMemory tool',
        'Response confirms memory was saved',
      ],
    },
  },
  {
    input: 'ok',
    expected: {
      groundTruth: [
        'Agent provides meaningful response despite short input',
        'Response is longer than 10 characters',
        'Agent uses fast path for short inputs',
      ],
    },
  },
];

// Main eval suite - DISABLED
// See ROOT_CAUSE.md for why this doesn't work in Evalite
*/
