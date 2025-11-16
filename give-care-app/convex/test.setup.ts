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

/**
 * Glob pattern for all Convex function files
 * Required by convex-test to find and load functions
 * Includes _generated directory for component types
 * 
 * Note: The _generated directory must exist before this module is imported.
 * In CI, run `convex codegen` before running tests.
 */
/// <reference types="vite/client" />
// Include both .js/.ts files AND ensure _generated is scanned
// The glob pattern matches files, but convex-test also checks for directory existence
// CRITICAL: _generated directory must exist BEFORE this module is imported
// Use npm pretest hooks or run codegen manually before tests
// 
// IMPORTANT: This glob MUST include _generated directory files
// The pattern './**/*.{js,ts}' will match files in _generated like api.js, server.js
export const modules = import.meta.glob('./**/*.{js,ts}', {
  // Don't exclude _generated - we need it!
  ignore: ['**/node_modules/**'],
});

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
 * - rateLimiter: Rate limiting (10 SMS/day)
 * - twilio: SMS sending/receiving with built-in handling
 *
 * This enables live E2E testing against real component implementations.
 * All component functions (e.g., components.agent.threads.*) work in tests.
 */
export function initConvexTest() {
  // Initialize test with schema and modules
  // Environment variables are loaded via vitest.config.ts (dotenv + test.env)
  // and are available through process.env in the test environment
  const t = convexTest(schema, modules);

  // Register components used by the app
  // Some components provide register function, others need manual registration
  agentTest.register(t, 'agent');
  t.registerComponent('workflow', workflowTest.schema, workflowTest.modules);
  rateLimiterTest.register(t, 'rateLimiter');

  // Register Twilio component (test mode - no real SMS sent)
  // Twilio doesn't export a test helper, so we need to manually define an empty schema
  // This allows component.twilio.* queries to work in tests without sending real SMS
  t.registerComponent('twilio', { tables: {} }, {});

  return t;
}
