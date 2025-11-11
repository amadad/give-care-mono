/**
 * Context Simulation Tests
 *
 * Purpose: Real Convex environment tests for context management
 * Spec: ARCHITECTURE.md - "Context Management" section
 * No Mocks: Uses real Convex mutations/queries
 *
 * NOTE: Updated to match current architecture (2025-01-08)
 * - Old API: hydrate/persist (removed)
 * - New API: ensureUserMutation, getByExternalIdQuery, recordMemory
 */

import { describe, it, expect } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { initConvexTest } from '../../convex/test.setup';

describe('Context Simulation Tests', () => {
  it('should create user from externalId', async () => {
    // ARCHITECTURE.md: "Core Model Helpers - ensureUser creates/retrieves users"
    const t = initConvexTest();

    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: 'sim_test_user_1',
      channel: 'sms',
      phone: '+15555551234',
    });

    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.externalId).toBe('sim_test_user_1');
    expect(user.phone).toBe('+15555551234');
    expect(user.channel).toBe('sms');
  });

  it('should retrieve existing user by externalId', async () => {
    // ARCHITECTURE.md: "Core Model Helpers - getByExternalId retrieves users"
    const t = initConvexTest();

    // Create user first
    const created = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: 'sim_test_user_2',
      channel: 'sms',
    });

    // Retrieve via query
    const retrieved = await t.query(api.public.getByExternalIdQuery, {
      externalId: 'sim_test_user_2',
    });

    expect(retrieved).toBeDefined();
    expect(retrieved?._id).toBe(created._id);
    expect(retrieved?.externalId).toBe('sim_test_user_2');
  });

  it('should update user metadata', async () => {
    // ARCHITECTURE.md: "Context Management - metadata stored in user.metadata"
    const t = initConvexTest();

    // Create user
    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: 'sim_test_user_3',
      channel: 'sms',
    });

    // Update metadata
    const updatedMetadata = {
      profile: {
        firstName: 'Alice',
        careRecipientName: 'Mom',
      },
      journeyPhase: 'active',
      totalInteractionCount: 5,
    };

    await t.mutation(internal.internal.updateUserMetadata, {
      userId: user._id,
      metadata: updatedMetadata,
    });

    // Verify updated
    const updated = await t.query(internal.internal.getUserById, {
      userId: user._id,
    });

    expect(updated?.metadata).toBeDefined();
    expect((updated?.metadata as any).profile.firstName).toBe('Alice');
    expect((updated?.metadata as any).journeyPhase).toBe('active');
  });

  it('should record memory with importance score', async () => {
    // ARCHITECTURE.md: "Working Memory System - recordMemory stores categorized memories"
    const t = initConvexTest();

    // Create user first
    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: 'sim_test_user_4',
      channel: 'sms',
    });

    // Record memory using externalId (current API)
    await t.mutation(api.public.recordMemory, {
      userId: user.externalId, // API expects externalId string
      category: 'care_routine',
      content: 'Morning bath at 9am, prefers lavender soap',
      importance: 8,
    });

    // Verify memory stored via listMemories query
    const memories = await t.query(api.public.listMemories, {
      userId: user.externalId,
      limit: 10,
    });

    expect(memories).toHaveLength(1);
    expect(memories[0].category).toBe('care_routine');
    expect(memories[0].content).toContain('Morning bath');
    expect(memories[0].importance).toBe(8);
  });

  it('should handle edge case: recordMemory for non-existent user', async () => {
    // Edge case: Memory recorded before user fully created
    // Expected: Should throw error (user must exist first)
    const t = initConvexTest();

    // Try to record memory without creating user first
    await expect(
      t.mutation(api.public.recordMemory, {
        userId: 'non_existent_user',
        category: 'preference',
        content: 'Likes yoga',
        importance: 6,
      })
    ).rejects.toThrow('User not found');

    // This test documents the current behavior: user must exist before recording memory
  });

  it('should handle edge case: concurrent user creation', async () => {
    // Edge case: Two ensureUser calls at exact same time
    // Expected: Should not create duplicate users (idempotent)
    const t = initConvexTest();

    const [user1, user2] = await Promise.all([
      t.mutation(internal.internal.ensureUserMutation, {
        externalId: 'sim_test_user_5',
        channel: 'sms',
      }),
      t.mutation(internal.internal.ensureUserMutation, {
        externalId: 'sim_test_user_5',
        channel: 'sms',
      }),
    ]);

    // Both should return the same user (no duplicates)
    expect(user1._id).toBe(user2._id);
    expect(user1.externalId).toBe(user2.externalId);
  });

  it('should list memories ordered by importance', async () => {
    // ARCHITECTURE.md: "listMemories returns memories ordered by importance"
    const t = initConvexTest();

    // Create user
    const user = await t.mutation(internal.internal.ensureUserMutation, {
      externalId: 'sim_test_user_6',
      channel: 'sms',
    });

    // Record multiple memories with different importance scores
    await t.mutation(api.public.recordMemory, {
      userId: user.externalId,
      category: 'preference',
      content: 'Low importance preference',
      importance: 3,
    });

    await t.mutation(api.public.recordMemory, {
      userId: user.externalId,
      category: 'care_routine',
      content: 'High importance routine',
      importance: 9,
    });

    await t.mutation(api.public.recordMemory, {
      userId: user.externalId,
      category: 'preference',
      content: 'Medium importance preference',
      importance: 6,
    });

    // List memories - should be ordered by importance (descending)
    const memories = await t.query(api.public.listMemories, {
      userId: user.externalId,
      limit: 10,
    });

    expect(memories.length).toBeGreaterThanOrEqual(3);
    // First memory should be highest importance
    expect(memories[0].importance).toBeGreaterThanOrEqual(memories[1].importance);
    expect(memories[1].importance).toBeGreaterThanOrEqual(memories[2].importance);
  });
});
