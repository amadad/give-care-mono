/**
 * Memory System E2E Tests
 *
 * Tests the new runner action/expectation types with memory scenarios
 */

import { describe, it, expect } from "vitest";
import { SimulationRunner } from "./runner";
import { recordMemoryBasic, memoryImportanceOrdering } from "./scenarios/memory";

describe("Memory E2E Tests", () => {
  it("should record memory with importance", async () => {
    const runner = new SimulationRunner();
    const result = await runner.runScenario(recordMemoryBasic);

    expect(result.success).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("should retrieve memories ordered by importance", async () => {
    const runner = new SimulationRunner();
    const result = await runner.runScenario(memoryImportanceOrdering);

    expect(result.success).toBe(true);
    expect(result.failures).toHaveLength(0);
  });
});
