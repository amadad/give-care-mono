/// <reference types="vite/client" />
import { test } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema.js";
import agent from "@convex-dev/agent/test";
import workflow from "@convex-dev/workflow/test";
import rateLimiter from "@convex-dev/rate-limiter/test";
export const modules = import.meta.glob("./**/*.*s");

export function initConvexTest() {
  const t = convexTest(schema, modules);

  // Register components with explicit names matching convex.config.ts
  // Note: This works for regular Vitest tests but NOT for Evalite (isolated environment)
  agent.register(t, "agent");
  t.registerComponent("workflow", workflow.schema, workflow.modules);
  rateLimiter.register(t, "rateLimiter");

  return t;
}

test("setup", () => {});
