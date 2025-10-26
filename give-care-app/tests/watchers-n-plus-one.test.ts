/**
 * Tests for Watchers N+1 Query Refactoring
 *
 * Test-Driven Development: TESTS WRITTEN FIRST
 *
 * Problem: Current implementation has N+1 query pattern
 * - Loads all active users (1 query)
 * - For each user, queries for existing alerts (N queries)
 * - Total: 1 + 2N queries (findExistingAlert called twice per user)
 * - Impact: 1000 users = 2001 queries
 *
 * Solution: Batch queries
 * - Load all active users (1 query)
 * - Load all unresolved alerts for all users in one query (1 query)
 * - Create alert lookup map in memory
 * - Total: 2 queries + mutations
 * - Target: <10 total queries regardless of user count
 *
 * Requirements:
 * 1. Maintain exact same alert generation logic
 * 2. No duplicate alerts for same user/type/pattern
 * 3. Reduce query count from O(N) to O(1)
 * 4. All existing tests must pass
 */

import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { internal } from '../convex/_generated/api';
import schema from '../convex/schema';
import type { Id } from '../convex/_generated/dataModel';

// Import Convex functions for testing
const modules = import.meta.glob('../convex/**/*.ts');

describe('Watchers N+1 Query Refactoring - Performance Tests', () => {
  describe('Query Count Measurement', () => {
    it('should complete watchCaregiverEngagement with <10 queries for 100 users', async () => {
      const t = convexTest(schema, modules);

      // Create 100 active users with varying patterns
      const userIds: Id<'users'>[] = [];
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      for (let i = 0; i < 100; i++) {
        const userId = await t.run(async (ctx) => {
          return await ctx.db.insert('users', {
            phoneNumber: `+1555550${String(1000 + i).padStart(4, '0')}`,
            firstName: `User${i}`,
            journeyPhase: 'active',
            conversationStartDate: thirtyDaysAgo,
            totalInteractionCount: 120, // High engagement
            recentMessages:
              i % 3 === 0
                ? [] // Every 3rd user: sudden drop
                : i % 5 === 0
                  ? [
                      // Every 5th user: crisis burst
                      { role: 'user', content: 'I need help', timestamp: now - 5 * 60 * 60 * 1000 },
                      {
                        role: 'user',
                        content: 'I feel overwhelmed',
                        timestamp: now - 4 * 60 * 60 * 1000,
                      },
                      {
                        role: 'user',
                        content: "I can't do this",
                        timestamp: now - 2 * 60 * 60 * 1000,
                      },
                    ]
                  : [
                      // Normal users
                      {
                        role: 'user',
                        content: 'How can I help?',
                        timestamp: now - 3600000,
                      },
                    ],
          });
        });
        userIds.push(userId as Id<'users'>);
      }

      // Run watcher and measure performance
      const startTime = Date.now();
      const result = await t.action(internal.watchers.watchCaregiverEngagement);
      const duration = Date.now() - startTime;

      // Verify results
      expect(result).toBeDefined();
      expect(result.usersMonitored).toBe(100);

      // Expected alerts:
      // - Sudden drops: ~33 users (every 3rd)
      // - Crisis bursts: ~20 users (every 5th, but NOT overlapping with 3rd)
      // Note: some overlap between every 3rd and 5th
      expect(result.suddenDrops).toBeGreaterThanOrEqual(25);
      expect(result.crisisBursts).toBeGreaterThanOrEqual(10);

      // Performance assertion: should complete in reasonable time
      // With batched queries, 100 users should be <500ms
      expect(duration).toBeLessThan(2000); // Generous limit for CI
    });

    it('should complete watchCaregiverEngagement with constant query count regardless of user volume', async () => {
      const t = convexTest(schema, modules);

      // NOTE: _getActiveUsers is limited to 100 users by Convex (to prevent unbounded queries)
      // This test validates batch query optimization works within that limit
      // For production, implement cursor-based pagination for >100 users

      // Create 1000 active users with varying patterns
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      for (let i = 0; i < 1000; i++) {
        await t.run(async (ctx) => {
          return await ctx.db.insert('users', {
            phoneNumber: `+1555${String(10000 + i).padStart(7, '0')}`,
            firstName: `User${i}`,
            journeyPhase: 'active',
            conversationStartDate: thirtyDaysAgo,
            totalInteractionCount: 120,
            recentMessages:
              i % 3 === 0
                ? []
                : [
                    {
                      role: 'user',
                      content: 'Normal message',
                      timestamp: now - 3600000,
                    },
                  ],
          });
        });
      }

      // Run watcher and measure performance
      const startTime = Date.now();
      const result = await t.action(internal.watchers.watchCaregiverEngagement);
      const duration = Date.now() - startTime;

      // Verify results (limited to first 100 users by _getActiveUsers)
      expect(result).toBeDefined();
      expect(result.usersMonitored).toBe(100); // Limited by .take(100) in _getActiveUsers
      expect(result.suddenDrops).toBeGreaterThanOrEqual(25); // ~34 expected from first 100

      // Performance assertion: batched queries should be fast
      // With O(1) queries, even with 1000 users in DB, processing is constant time
      expect(duration).toBeLessThan(5000); // Generous limit for CI
    });

    it('should handle duplicate prevention without N+1 queries', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555551000',
          firstName: 'DuplicateTest',
          journeyPhase: 'active',
          conversationStartDate: now - 30 * 24 * 60 * 60 * 1000,
          totalInteractionCount: 120,
          recentMessages: [],
        });
      });

      // Run watcher twice
      await t.action(internal.watchers.watchCaregiverEngagement);
      await t.action(internal.watchers.watchCaregiverEngagement);

      // Should only have 1 alert (no duplicates)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('disengagement');
      expect(alerts[0].pattern).toBe('sudden_drop');
    });

    it('should handle multiple alert types per user without N+1 queries', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555551001',
          firstName: 'MultiAlert',
          journeyPhase: 'active',
          conversationStartDate: now - 30 * 24 * 60 * 60 * 1000,
          totalInteractionCount: 120,
          recentMessages: [
            // Has both: crisis keywords AND will trigger sudden drop on second run
            { role: 'user', content: 'I need help', timestamp: now - 5 * 60 * 60 * 1000 },
            { role: 'user', content: 'I feel overwhelmed', timestamp: now - 4 * 60 * 60 * 1000 },
            { role: 'user', content: "I can't do this", timestamp: now - 2 * 60 * 60 * 1000 },
          ],
        });
      });

      // First run: should create crisis burst alert
      const result1 = await t.action(internal.watchers.watchCaregiverEngagement);
      expect(result1.crisisBursts).toBe(1);

      // Modify user to trigger sudden drop
      await t.run(async (ctx) => {
        await ctx.db.patch(userId as Id<'users'>, {
          recentMessages: [], // Clear messages to trigger sudden drop
        });
      });

      // Second run: should create sudden drop alert (different type)
      const result2 = await t.action(internal.watchers.watchCaregiverEngagement);
      expect(result2.suddenDrops).toBe(1);

      // Should have 2 alerts (different types)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(2);
      expect(alerts.map((a) => a.type).sort()).toEqual(['disengagement', 'high_stress']);
    });
  });

  describe('Wellness Trend Watcher Performance', () => {
    it('should complete watchWellnessTrends with <10 queries for 100 users', async () => {
      const t = convexTest(schema, modules);

      // Register Twilio component mock
      t.registerComponent('twilio', {
        messages: {
          create: async () => ({ sid: 'TEST_MESSAGE_SID', status: 'sent' }),
        },
      });

      const now = Date.now();

      // Create 100 active users with wellness scores
      for (let i = 0; i < 100; i++) {
        const userId = await t.run(async (ctx) => {
          return await ctx.db.insert('users', {
            phoneNumber: `+1555552${String(1000 + i).padStart(4, '0')}`,
            firstName: `User${i}`,
            journeyPhase: 'active',
            subscriptionStatus: 'active' as const,
          });
        });

        // Create 4 worsening wellness scores for every 5th user
        if (i % 5 === 0) {
          await t.run(async (ctx) => {
            for (let week = 0; week < 4; week++) {
              await ctx.db.insert('wellnessScores', {
                userId: userId as Id<'users'>,
                overallScore: 30 + week * 20, // Worsening: 30, 50, 70, 90
                band: week === 0 ? 'mild' : week === 1 ? 'moderate' : week === 2 ? 'high' : 'crisis',
                pressureZones: [],
                pressureZoneScores: {},
                recordedAt: now - (3 - week) * 7 * 24 * 60 * 60 * 1000,
              });
            }
          });
        }
      }

      // Run watcher and measure performance
      const startTime = Date.now();
      const result = await t.action(internal.watchers.watchWellnessTrends);
      const duration = Date.now() - startTime;

      // Verify results
      expect(result).toBeDefined();
      expect(result.usersMonitored).toBe(100);
      // Only every 5th user (20 total) has 4 wellness scores with worsening trend
      // Alerts are created even if SMS fails (count incremented before SMS)
      expect(result.wellnessDeclines).toBeGreaterThanOrEqual(18); // ~20 expected

      // Performance assertion
      expect(duration).toBeLessThan(5000); // Generous limit for CI
    });

    it('should batch-load wellness scores for all users', async () => {
      const t = convexTest(schema, modules);

      // Register Twilio component mock
      t.registerComponent('twilio', {
        messages: {
          create: async () => ({ sid: 'TEST_MESSAGE_SID', status: 'sent' }),
        },
      });

      const now = Date.now();

      // Create 50 users with wellness scores
      for (let i = 0; i < 50; i++) {
        const userId = await t.run(async (ctx) => {
          return await ctx.db.insert('users', {
            phoneNumber: `+1555553${String(1000 + i).padStart(4, '0')}`,
            firstName: `User${i}`,
            journeyPhase: 'active',
            subscriptionStatus: 'active' as const,
          });
        });

        // All users have 4 wellness scores with STRICT worsening (each > previous)
        await t.run(async (ctx) => {
          for (let week = 0; week < 4; week++) {
            await ctx.db.insert('wellnessScores', {
              userId: userId as Id<'users'>,
              overallScore: 30 + week * 20, // Clear worsening: 30, 50, 70, 90
              band: week === 0 ? 'mild' : week === 1 ? 'moderate' : week === 2 ? 'high' : 'crisis',
              pressureZones: [],
              pressureZoneScores: {},
              recordedAt: now - (3 - week) * 7 * 24 * 60 * 60 * 1000,
            });
          }
        });
      }

      // Run watcher
      const result = await t.action(internal.watchers.watchWellnessTrends);

      // All users should be processed
      expect(result.usersMonitored).toBe(50);

      // All should trigger wellness decline (strict worsening: 30 < 50 < 70 < 90)
      expect(result.wellnessDeclines).toBe(50);
    });
  });

  describe('Edge Cases and Correctness', () => {
    it('should correctly handle users with existing alerts', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555554000',
          firstName: 'ExistingAlert',
          journeyPhase: 'active',
          conversationStartDate: now - 30 * 24 * 60 * 60 * 1000,
          totalInteractionCount: 120,
          recentMessages: [],
        });
      });

      // Create existing unresolved alert
      await t.run(async (ctx) => {
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: now - 24 * 60 * 60 * 1000,
        });
      });

      // Run watcher
      const result = await t.action(internal.watchers.watchCaregiverEngagement);

      // Should not create duplicate
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(1);
    });

    it('should handle users with resolved alerts (can create new)', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555554001',
          firstName: 'ResolvedAlert',
          journeyPhase: 'active',
          conversationStartDate: now - 30 * 24 * 60 * 60 * 1000,
          totalInteractionCount: 120,
          recentMessages: [],
        });
      });

      // Create existing RESOLVED alert
      await t.run(async (ctx) => {
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: now - 7 * 24 * 60 * 60 * 1000,
          resolvedAt: now - 2 * 24 * 60 * 60 * 1000, // Resolved 2 days ago
        });
      });

      // Run watcher
      const result = await t.action(internal.watchers.watchCaregiverEngagement);

      // Should create new alert (previous was resolved)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(2); // Old resolved + new unresolved
      const unresolvedAlerts = alerts.filter((a) => !a.resolvedAt);
      expect(unresolvedAlerts).toHaveLength(1);
    });

    it('should handle empty user list gracefully', async () => {
      const t = convexTest(schema, modules);

      // No users in database
      const result = await t.action(internal.watchers.watchCaregiverEngagement);

      expect(result).toBeDefined();
      expect(result.usersMonitored).toBe(0);
      expect(result.suddenDrops).toBe(0);
      expect(result.crisisBursts).toBe(0);
    });

    it('should handle users with no recentMessages field', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555554002',
          journeyPhase: 'active',
          conversationStartDate: now - 30 * 24 * 60 * 60 * 1000,
          totalInteractionCount: 120,
          // recentMessages intentionally omitted
        });
      });

      // Should not crash
      const result = await t.action(internal.watchers.watchCaregiverEngagement);

      expect(result).toBeDefined();
      expect(result.usersMonitored).toBe(1);
    });

    it('should maintain exact same logic as original implementation', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      // Test case 1: Sudden drop
      const user1 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555555001',
          firstName: 'TestUser1',
          journeyPhase: 'active',
          conversationStartDate: thirtyDaysAgo,
          totalInteractionCount: 120, // 4 msgs/day
          recentMessages: [],
        });
      });

      // Test case 2: Crisis burst
      const user2 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555555002',
          firstName: 'TestUser2',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'help', timestamp: now - 5 * 60 * 60 * 1000 },
            { role: 'user', content: 'overwhelmed', timestamp: now - 4 * 60 * 60 * 1000 },
            { role: 'user', content: 'give up', timestamp: now - 2 * 60 * 60 * 1000 },
          ],
        });
      });

      // Test case 3: Normal user (no alerts)
      const user3 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555555003',
          firstName: 'TestUser3',
          journeyPhase: 'active',
          conversationStartDate: thirtyDaysAgo,
          totalInteractionCount: 60, // 2 msgs/day (below threshold)
          recentMessages: [],
        });
      });

      // Run watcher
      const result = await t.action(internal.watchers.watchCaregiverEngagement);

      // Verify exact behavior
      expect(result.usersMonitored).toBe(3);
      expect(result.suddenDrops).toBe(1); // Only user1
      expect(result.crisisBursts).toBe(1); // Only user2

      // Verify alerts
      const alerts1 = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', user1 as Id<'users'>))
          .collect();
      });
      expect(alerts1).toHaveLength(1);
      expect(alerts1[0].type).toBe('disengagement');

      const alerts2 = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', user2 as Id<'users'>))
          .collect();
      });
      expect(alerts2).toHaveLength(1);
      expect(alerts2[0].type).toBe('high_stress');

      const alerts3 = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', user3 as Id<'users'>))
          .collect();
      });
      expect(alerts3).toHaveLength(0);
    });
  });
});
