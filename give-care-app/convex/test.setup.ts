/**
 * Test setup for convex-test
 *
 * Exports glob pattern for all Convex function files
 */

/// <reference types="vite/client" />
export const modules = import.meta.glob('./**/!(*.*.*)*.*s');
