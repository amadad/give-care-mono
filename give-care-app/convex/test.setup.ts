/**
 * Test setup for convex-test
 *
 * Provides initConvexTest helper for integration tests
 *
 * NO MOCKS - Uses real Convex components and functions for live E2E testing
 */

import { convexTest } from 'convex-test';
import schema from './schema';
import agentTest from '@convex-dev/agent/test';
import workflowTest from '@convex-dev/workflow/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import twilioSchema from './lib/twilioComponentSchema';

/**
 * Glob pattern for all Convex function files
 * Required by convex-test to find and load functions
 *
 * In a monorepo, convex-test may not find convex/ relative to node_modules,
 * so we explicitly pass modules using import.meta.glob
 *
 * CRITICAL: import.meta.glob is evaluated at BUILD TIME by Vite
 * The _generated directory MUST exist when Vitest transforms this file
 * This is ensured by running 'convex codegen' BEFORE Vitest starts (via pretest hooks or CI step)
 */
/// <reference types="vite/client" />
export const modules = import.meta.glob('./**/*.{js,ts}');

const agentComponentModules = import.meta.glob(
  '../node_modules/@convex-dev/agent/dist/component/**/*.js'
);

const workflowComponentModules = import.meta.glob(
  '../node_modules/@convex-dev/workflow/dist/component/**/*.js'
);

const rateLimiterComponentModules = import.meta.glob(
  '../node_modules/@convex-dev/rate-limiter/dist/component/**/*.js'
);

const twilioComponentModules = import.meta.glob(
  '../node_modules/@convex-dev/twilio/dist/esm/component/**/*.js'
);

/**
 * Initialize Convex test environment with REAL components
 *
 * Returns a test instance with:
 * - query: Execute Convex queries
 * - mutation: Execute Convex mutations
 * - action: Execute Convex actions
 * - run: Execute arbitrary function
 * - finishAllScheduledFunctions: Wait for all scheduled functions
 *
 * Components are registered from convex.config.ts (real components, not mocks):
 * - agent: Thread/message management, vector search, RAG
 * - workflow: Durable workflows for check-ins, engagement, trends
 * - rateLimiter: Rate limiting (30 SMS/day)
 * - twilio: SMS sending/receiving with built-in handling
 *
 * This enables live E2E testing against real component implementations.
 * All component functions (e.g., components.agent.threads.*) work in tests.
 */
export function initConvexTest() {
  // Initialize test with schema and modules
  // In monorepo, we must pass modules explicitly because convex-test
  // may not find convex/ relative to hoisted node_modules
  // Environment variables are loaded via vitest.config.ts (dotenv + test.env)
  // and are available through process.env in the test environment
  // 
  // CRITICAL: _generated directory must exist when import.meta.glob is evaluated
  // This is ensured by running 'convex codegen' BEFORE Vitest starts
  const t = convexTest(schema, modules);

  // Register components used by the app
  // Use custom globs that include *_generated/*.js artifacts required by convex-test
  t.registerComponent('agent', agentTest.schema, agentComponentModules);
  t.registerComponent('workflow', workflowTest.schema, workflowComponentModules);
  t.registerComponent('rateLimiter', rateLimiterTest.schema, rateLimiterComponentModules);

  // Register Twilio component (no-op schema but required tables for stub SMS)
  t.registerComponent('twilio', twilioSchema, twilioComponentModules);

  return t;
}
