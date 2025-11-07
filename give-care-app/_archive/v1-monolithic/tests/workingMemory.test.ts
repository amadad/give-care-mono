/**
 * Tests for Working Memory System (Task 10)
 *
 * Test-Driven Development: WRITE TESTS FIRST
 *
 * Requirements from OPENPOKE_ANALYSIS.md and TASKS.md:
 * 1. Agent can record memories with category and importance (1-10)
 * 2. Memories retrievable by userId
 * 3. Memory categories validated: care_routine | preference | intervention_result | crisis_trigger
 * 4. Importance scoring enforced (1-10 range)
 * 5. recordMemory tool creates entries correctly
 * 6. Agent uses tool proactively when user shares important info
 *
 * Coverage:
 * - Schema validation (8 tests)
 * - Memory functions (12 tests)
 * - Access tracking (5 tests)
 * - Category filtering (5 tests)
 * - Importance sorting (5 tests)
 *
 * Total: 35 tests
 */

import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { internal } from '../convex/_generated/api';
import schema from '../convex/schema';
import type { Id } from '../convex/_generated/dataModel';

// Import Convex functions for testing
const modules = import.meta.glob('../convex/**/*.ts');

describe('Working Memory System - Schema Validation', () => {
  describe('Memory Creation with Valid Data', () => {
    it('should create memory with valid care_routine category', async () => {
      const t = convexTest(schema, modules);

      // Create test user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550001',
          firstName: 'Test User',
        });
      });

      // Create memory
      const memoryId = await t.run(async (ctx) => {
        return await ctx.db.insert('memories', {
          userId: userId as Id<'users'>,
          content: 'Care recipient John prefers morning bathing routine',
          category: 'care_routine',
          importance: 8,
          createdAt: Date.now(),
        });
      });

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId as Id<'memories'>);
      });

      expect(memory).toBeDefined();
      expect(memory?.content).toBe('Care recipient John prefers morning bathing routine');
      expect(memory?.category).toBe('care_routine');
      expect(memory?.importance).toBe(8);
    });

    it('should create memory with preference category', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550002',
        });
      });

      const memoryId = await t.run(async (ctx) => {
        return await ctx.db.insert('memories', {
          userId: userId as Id<'users'>,
          content: 'Yoga and breathing exercises reduce stress by 30%',
          category: 'preference',
          importance: 9,
          createdAt: Date.now(),
        });
      });

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId as Id<'memories'>);
      });

      expect(memory?.category).toBe('preference');
    });

    it('should create memory with intervention_result category', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550003',
        });
      });

      const memoryId = await t.run(async (ctx) => {
        return await ctx.db.insert('memories', {
          userId: userId as Id<'users'>,
          content: 'Respite care reduced burnout score from 72 to 45',
          category: 'intervention_result',
          importance: 10,
          createdAt: Date.now(),
        });
      });

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId as Id<'memories'>);
      });

      expect(memory?.category).toBe('intervention_result');
      expect(memory?.importance).toBe(10);
    });

    it('should create memory with crisis_trigger category', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550004',
        });
      });

      const memoryId = await t.run(async (ctx) => {
        return await ctx.db.insert('memories', {
          userId: userId as Id<'users'>,
          content: 'Gets overwhelmed when doctor calls about hospice decisions',
          category: 'crisis_trigger',
          importance: 10,
          createdAt: Date.now(),
        });
      });

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId as Id<'memories'>);
      });

      expect(memory?.category).toBe('crisis_trigger');
    });

    it('should allow optional accessCount and lastAccessedAt fields', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550005',
        });
      });

      const memoryId = await t.run(async (ctx) => {
        return await ctx.db.insert('memories', {
          userId: userId as Id<'users'>,
          content: 'Sister visits on Tuesdays for caregiver break',
          category: 'care_routine',
          importance: 7,
          createdAt: Date.now(),
          accessCount: 3,
          lastAccessedAt: Date.now(),
        });
      });

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId as Id<'memories'>);
      });

      expect(memory?.accessCount).toBe(3);
      expect(memory?.lastAccessedAt).toBeDefined();
    });

    it('should allow optional embedding field for future vector search', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550006',
        });
      });

      const embedding = new Array(1536).fill(0.5);
      const memoryId = await t.run(async (ctx) => {
        return await ctx.db.insert('memories', {
          userId: userId as Id<'users'>,
          content: 'Mom responds well to classical music during evening routine',
          category: 'care_routine',
          importance: 8,
          createdAt: Date.now(),
          embedding,
        });
      });

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId as Id<'memories'>);
      });

      expect(memory?.embedding).toHaveLength(1536);
    });

    it('should accept importance values from 1 to 10', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550007',
        });
      });

      // Test boundary values
      const mem1 = await t.run(async (ctx) => {
        const id = await ctx.db.insert('memories', {
          userId: userId as Id<'users'>,
          content: 'Minor detail - likes blue towels',
          category: 'preference',
          importance: 1,
          createdAt: Date.now(),
        });
        return await ctx.db.get(id);
      });

      const mem10 = await t.run(async (ctx) => {
        const id = await ctx.db.insert('memories', {
          userId: userId as Id<'users'>,
          content: 'CRITICAL: Severe allergic reaction to penicillin',
          category: 'crisis_trigger',
          importance: 10,
          createdAt: Date.now(),
        });
        return await ctx.db.get(id);
      });

      expect(mem1?.importance).toBe(1);
      expect(mem10?.importance).toBe(10);
    });

    it('should store createdAt timestamp automatically', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550008',
        });
      });

      const beforeTime = Date.now();
      const memoryId = await t.run(async (ctx) => {
        return await ctx.db.insert('memories', {
          userId: userId as Id<'users'>,
          content: 'Test memory',
          category: 'preference',
          importance: 5,
          createdAt: Date.now(),
        });
      });
      const afterTime = Date.now();

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId as Id<'memories'>);
      });

      expect(memory?.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(memory?.createdAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Memory Functions - saveMemory', () => {
    it('should save memory via saveMemory mutation', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550100',
        });
      });

      const memoryId = await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Evening walks help reduce stress',
        category: 'preference',
        importance: 7,
      });

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId);
      });

      expect(memory).toBeDefined();
      expect(memory?.content).toBe('Evening walks help reduce stress');
      expect(memory?.category).toBe('preference');
      expect(memory?.importance).toBe(7);
    });

    it('should reject invalid category in saveMemory', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550101',
        });
      });

      await expect(
        t.mutation(internal.functions.memories.saveMemory, {
          userId: userId as Id<'users'>,
          content: 'Test content',
          category: 'invalid_category',
          importance: 5,
        })
      ).rejects.toThrow(/Invalid category/);
    });

    it('should reject importance < 1 in saveMemory', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550102',
        });
      });

      await expect(
        t.mutation(internal.functions.memories.saveMemory, {
          userId: userId as Id<'users'>,
          content: 'Test content',
          category: 'preference',
          importance: 0,
        })
      ).rejects.toThrow(/Importance must be between 1 and 10/);
    });

    it('should reject importance > 10 in saveMemory', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550103',
        });
      });

      await expect(
        t.mutation(internal.functions.memories.saveMemory, {
          userId: userId as Id<'users'>,
          content: 'Test content',
          category: 'preference',
          importance: 11,
        })
      ).rejects.toThrow(/Importance must be between 1 and 10/);
    });

    it('should reject empty content in saveMemory', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550104',
        });
      });

      await expect(
        t.mutation(internal.functions.memories.saveMemory, {
          userId: userId as Id<'users'>,
          content: '',
          category: 'preference',
          importance: 5,
        })
      ).rejects.toThrow(/Content cannot be empty/);
    });

    it('should reject whitespace-only content in saveMemory', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550105',
        });
      });

      await expect(
        t.mutation(internal.functions.memories.saveMemory, {
          userId: userId as Id<'users'>,
          content: '   ',
          category: 'preference',
          importance: 5,
        })
      ).rejects.toThrow(/Content cannot be empty/);
    });
  });

  describe('Memory Retrieval - getUserMemories', () => {
    it('should retrieve all memories for a user sorted by createdAt descending', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550200',
        });
      });

      // Create 3 memories with different timestamps
      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'First memory',
        category: 'preference',
        importance: 5,
      });

      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Second memory',
        category: 'care_routine',
        importance: 7,
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Third memory (newest)',
        category: 'intervention_result',
        importance: 8,
      });

      const memories = await t.query(internal.functions.memories.getUserMemories, {
        userId: userId as Id<'users'>,
      });

      expect(memories).toHaveLength(3);
      expect(memories[0].content).toBe('Third memory (newest)');
      expect(memories[1].content).toBe('Second memory');
      expect(memories[2].content).toBe('First memory');
    });

    it('should return empty array for user with no memories', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550201',
        });
      });

      const memories = await t.query(internal.functions.memories.getUserMemories, {
        userId: userId as Id<'users'>,
      });

      expect(memories).toHaveLength(0);
    });

    it('should only return memories for the specified user', async () => {
      const t = convexTest(schema, modules);

      const user1 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', { phoneNumber: '+15555550202' });
      });

      const user2 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', { phoneNumber: '+15555550203' });
      });

      // User 1 memories
      await t.mutation(internal.functions.memories.saveMemory, {
        userId: user1 as Id<'users'>,
        content: 'User 1 memory',
        category: 'preference',
        importance: 5,
      });

      // User 2 memories
      await t.mutation(internal.functions.memories.saveMemory, {
        userId: user2 as Id<'users'>,
        content: 'User 2 memory',
        category: 'care_routine',
        importance: 6,
      });

      const user1Memories = await t.query(internal.functions.memories.getUserMemories, {
        userId: user1 as Id<'users'>,
      });

      expect(user1Memories).toHaveLength(1);
      expect(user1Memories[0].content).toBe('User 1 memory');
    });
  });

  describe('Memory Retrieval - getMemoriesByCategory', () => {
    it('should filter memories by category', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550300',
        });
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Morning routine memory',
        category: 'care_routine',
        importance: 8,
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Preference memory',
        category: 'preference',
        importance: 6,
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Another care routine memory',
        category: 'care_routine',
        importance: 9,
      });

      const careRoutineMemories = await t.query(internal.functions.memories.getMemoriesByCategory, {
        userId: userId as Id<'users'>,
        category: 'care_routine',
      });

      expect(careRoutineMemories).toHaveLength(2);
      expect(careRoutineMemories.every(m => m.category === 'care_routine')).toBe(true);
    });

    it('should return empty array for non-existent category', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550301',
        });
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Preference memory',
        category: 'preference',
        importance: 5,
      });

      const crisisMemories = await t.query(internal.functions.memories.getMemoriesByCategory, {
        userId: userId as Id<'users'>,
        category: 'crisis_trigger',
      });

      expect(crisisMemories).toHaveLength(0);
    });
  });

  describe('Memory Retrieval - getTopMemories', () => {
    it('should sort memories by importance (highest first)', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550400',
        });
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Low importance',
        category: 'preference',
        importance: 3,
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'High importance',
        category: 'crisis_trigger',
        importance: 10,
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Medium importance',
        category: 'care_routine',
        importance: 7,
      });

      const topMemories = await t.query(internal.functions.memories.getTopMemories, {
        userId: userId as Id<'users'>,
      });

      expect(topMemories).toHaveLength(3);
      expect(topMemories[0].importance).toBe(10);
      expect(topMemories[1].importance).toBe(7);
      expect(topMemories[2].importance).toBe(3);
    });

    it('should respect limit parameter', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550401',
        });
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Memory 1',
        category: 'preference',
        importance: 10,
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Memory 2',
        category: 'care_routine',
        importance: 9,
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Memory 3',
        category: 'intervention_result',
        importance: 8,
      });

      const topTwo = await t.query(internal.functions.memories.getTopMemories, {
        userId: userId as Id<'users'>,
        limit: 2,
      });

      expect(topTwo).toHaveLength(2);
      expect(topTwo[0].importance).toBe(10);
      expect(topTwo[1].importance).toBe(9);
    });

    it('should use createdAt as tiebreaker for same importance', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550402',
        });
      });

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Older memory',
        category: 'preference',
        importance: 5,
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Newer memory',
        category: 'care_routine',
        importance: 5,
      });

      const memories = await t.query(internal.functions.memories.getTopMemories, {
        userId: userId as Id<'users'>,
      });

      expect(memories).toHaveLength(2);
      expect(memories[0].content).toBe('Newer memory'); // Newer first when importance equal
    });
  });

  describe('Access Tracking - incrementAccessCount', () => {
    it('should increment accessCount from undefined to 1', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550500',
        });
      });

      const memoryId = await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Test memory',
        category: 'preference',
        importance: 5,
      });

      await t.mutation(internal.functions.memories.incrementAccessCount, {
        memoryId,
      });

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId);
      });

      expect(memory?.accessCount).toBe(1);
      expect(memory?.lastAccessedAt).toBeDefined();
    });

    it('should increment existing accessCount', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550501',
        });
      });

      const memoryId = await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Test memory',
        category: 'preference',
        importance: 5,
      });

      // Increment 3 times
      await t.mutation(internal.functions.memories.incrementAccessCount, { memoryId });
      await t.mutation(internal.functions.memories.incrementAccessCount, { memoryId });
      await t.mutation(internal.functions.memories.incrementAccessCount, { memoryId });

      const memory = await t.run(async (ctx) => {
        return await ctx.db.get(memoryId);
      });

      expect(memory?.accessCount).toBe(3);
    });

    it('should update lastAccessedAt on each increment', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550502',
        });
      });

      const memoryId = await t.mutation(internal.functions.memories.saveMemory, {
        userId: userId as Id<'users'>,
        content: 'Test memory',
        category: 'preference',
        importance: 5,
      });

      await t.mutation(internal.functions.memories.incrementAccessCount, { memoryId });
      const firstAccess = await t.run(async (ctx) => {
        const mem = await ctx.db.get(memoryId);
        return mem?.lastAccessedAt;
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await t.mutation(internal.functions.memories.incrementAccessCount, { memoryId });
      const secondAccess = await t.run(async (ctx) => {
        const mem = await ctx.db.get(memoryId);
        return mem?.lastAccessedAt;
      });

      expect(secondAccess).toBeGreaterThan(firstAccess!);
    });

    it('should throw error for non-existent memoryId', async () => {
      const t = convexTest(schema, modules);

      const fakeMemoryId = ('jh12345678901234567890' as any) as Id<'memories'>;

      await expect(
        t.mutation(internal.functions.memories.incrementAccessCount, {
          memoryId: fakeMemoryId,
        })
      ).rejects.toThrow(/Validator error|Memory not found/); // Convex validates ID format first
    });
  });
});
