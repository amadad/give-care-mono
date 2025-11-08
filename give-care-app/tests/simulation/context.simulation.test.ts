/**
 * Context Simulation Tests
 * 
 * Purpose: Real Convex environment tests for context management
 * Spec: ARCHITECTURE.md - "Context Management" section
 * No Mocks: Uses real Convex mutations/queries
 */

import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';
import { modules } from '../../convex/test.setup';

describe('Context Simulation Tests', () => {
  it('should hydrate user session from externalId', async () => {
    // ARCHITECTURE.md: "Conversation Management - hydrate loads/creates user session"
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_test_user_1',
        channel: 'sms',
        phone: '+15555551234',
      },
    });

    expect(result).toBeDefined();
    expect(result.userId).toBeDefined();
    expect(result.sessionId).toBeDefined();
    expect(result.metadata).toBeDefined();
  });

  it('should persist context metadata', async () => {
    // ARCHITECTURE.md: "Context Management - persist saves session state"
    const t = convexTest(schema, modules);

    // First hydrate to create session
    const hydrated = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_test_user_2',
        channel: 'sms',
      },
    });

    // Then persist updated metadata
    await t.mutation(api.functions.context.persist, {
      context: {
        userId: hydrated.userId,
        sessionId: hydrated.sessionId,
        locale: 'en-US',
        policyBundle: 'trauma_informed_v1',
        promptHistory: [],
        consent: { emergency: true, marketing: false },
        metadata: {
          profile: {
            firstName: 'Alice',
            careRecipientName: 'Mom',
          },
          journeyPhase: 'active',
          totalInteractionCount: 5,
        },
        budget: { maxInputTokens: 2000, maxOutputTokens: 1000, maxTools: 2 },
      },
    });

    // Verify persisted
    const session = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_test_user_2',
        channel: 'sms',
      },
    });

    expect((session.metadata as any).profile.firstName).toBe('Alice');
    expect((session.metadata as any).journeyPhase).toBe('active');
  });

  it('should record memory with importance score', async () => {
    // ARCHITECTURE.md: "Working Memory System - recordMemory stores categorized memories"
    const t = convexTest(schema, modules);

    const hydrated = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_test_user_3',
        channel: 'sms',
      },
    });

    await t.mutation(api.functions.context.recordMemory, {
      userId: hydrated.userId,
      category: 'care_routine',
      content: 'Morning bath at 9am, prefers lavender soap',
      importance: 8,
    });

    // Verify memory stored
    const memories = await t.run(async (ctx) => {
      const user = await ctx.db
        .query('users')
        .withIndex('by_externalId', (q) => q.eq('externalId', 'sim_test_user_3'))
        .unique();

      return ctx.db
        .query('memories')
        .filter((q) => q.eq(q.field('userId'), user!._id))
        .collect();
    });

    expect(memories).toHaveLength(1);
    expect(memories[0].category).toBe('care_routine');
    expect(memories[0].content).toContain('Morning bath');
    expect(memories[0].importance).toBe(8);
  });

  it('should handle edge case: recordMemory for non-existent user', async () => {
    // Edge case: Memory recorded before user fully created
    // Expected: Should use externalId and backfill userId later
    const t = convexTest(schema, modules);

    // Try to record memory without hydrating user first
    await expect(
      t.mutation(api.functions.context.recordMemory, {
        userId: 'non_existent_user',
        category: 'preference',
        content: 'Likes yoga',
        importance: 6,
      })
    ).rejects.toThrow('User not found');

    // This test documents the current behavior
  });

  it('should handle edge case: concurrent session creation', async () => {
    // Edge case: Two hydrate calls at exact same time
    // Expected: Should not create duplicate sessions
    const t = convexTest(schema, modules);

    const [session1, session2] = await Promise.all([
      t.mutation(api.functions.context.hydrate, {
        user: { externalId: 'sim_test_user_4', channel: 'sms' },
      }),
      t.mutation(api.functions.context.hydrate, {
        user: { externalId: 'sim_test_user_4', channel: 'sms' },
      }),
    ]);

    // Both should return the same sessionId (no duplicates)
    expect(session1.sessionId).toBe(session2.sessionId);
  });
});
