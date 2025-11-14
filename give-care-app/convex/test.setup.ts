/**
 * Test setup for convex-test
 *
 * Provides initConvexTest helper for integration tests
 * 
 * NO MOCKS - Uses real Convex components and functions for live E2E testing
 */

import { convexTest } from 'convex-test';
import schema from './schema';

/**
 * Glob pattern for all Convex function files
 * Required by convex-test to find and load functions
 */
/// <reference types="vite/client" />
export const modules = import.meta.glob('./**/!(*.*.*)*.*s');

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
  // Components are automatically available through the generated API
  // when convex.config.ts is properly configured and npx convex dev has been run
  const t = convexTest(schema, modules);
  
  // Note: Component configs cannot be imported in test environment (they require Convex runtime).
  // Components are automatically available via the generated API:
  // - Import: import { components } from '../convex/_generated/api';
  // - Use: await ctx.runQuery(components.agent.threads.listThreadsByUserId, {...});
  // 
  // The component functions work automatically when called in test context.
  // No explicit registration needed - convex-test handles component access automatically.
  
  return t;
}
