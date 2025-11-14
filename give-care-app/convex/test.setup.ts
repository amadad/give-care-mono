/**
 * Test setup for convex-test
 *
 * Provides initConvexTest helper for integration tests
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
 * Initialize Convex test environment
 *
 * Returns a test instance with:
 * - query: Execute Convex queries
 * - mutation: Execute Convex mutations
 * - action: Execute Convex actions
 * - run: Execute arbitrary function
 * - finishAllScheduledFunctions: Wait for all scheduled functions
 */
export function initConvexTest() {
  return convexTest(schema, modules);
}
