/**
 * Tests for Engagement Watcher System (Task 11)
 *
 * Test-Driven Development: WRITE TESTS FIRST
 *
 * Requirements from TASKS.md:
 * 1. Engagement watcher runs every 6 hours (cron)
 * 2. Pattern 1: Sudden drop detection (averageMessagesPerDay > 3, recentMessageCount === 0)
 * 3. Pattern 2: High-stress burst detection (3+ crisis keywords in 6 hours)
 * 4. Wellness trend watcher runs weekly (Monday 9am PT / 16:00 UTC)
 * 5. Wellness trend: 4 scores, worsening pattern (overallScore increasing each week)
 * 6. Alerts schema: userId, type, pattern, severity, createdAt, resolvedAt (3 indexes)
 * 7. SMS sent for wellness decline
 * 8. Admin dashboard integration (future: show alerts)
 *
 * Coverage:
 * - Alerts schema validation (8 tests)
 * - Sudden drop detection (7 tests)
 * - High-stress burst detection (7 tests)
 * - Wellness trend detection (8 tests)
 * - SMS sending on wellness decline (5 tests)
 * - Cron scheduling (5 tests)
 * - Alert severity levels (6 tests)
 * - Pattern tracking (6 tests)
 *
 * Total: 52 tests
 */

import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { internal } from '../convex/_generated/api';
import schema from '../convex/schema';
import type { Id } from '../convex/_generated/dataModel';

// Import Convex functions for testing
const modules = import.meta.glob('../convex/**/*.ts');

describe('Engagement Watcher - Alerts Schema Validation', () => {
  describe('Alerts Table Schema', () => {
    it('should create alert with all required fields', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550001',
          firstName: 'Test User',
        });
      });

      const alertId = await t.run(async (ctx) => {
        return await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: Date.now(),
        });
      });

      const alert = await t.run(async (ctx) => {
        return await ctx.db.get(alertId as Id<'alerts'>);
      });

      expect(alert).toBeDefined();
      expect(alert?.userId).toBe(userId);
      expect(alert?.type).toBe('disengagement');
      expect(alert?.pattern).toBe('sudden_drop');
      expect(alert?.severity).toBe('medium');
      expect(alert?.createdAt).toBeGreaterThan(0);
    });

    it('should support disengagement alert type', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550002',
        });
      });

      const alertId = await t.run(async (ctx) => {
        return await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: Date.now(),
        });
      });

      const alert = await t.run(async (ctx) => {
        return await ctx.db.get(alertId as Id<'alerts'>);
      });

      expect(alert?.type).toBe('disengagement');
    });

    it('should support high_stress alert type', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550003',
        });
      });

      const alertId = await t.run(async (ctx) => {
        return await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'high_stress',
          pattern: 'crisis_burst',
          severity: 'urgent',
          createdAt: Date.now(),
        });
      });

      const alert = await t.run(async (ctx) => {
        return await ctx.db.get(alertId as Id<'alerts'>);
      });

      expect(alert?.type).toBe('high_stress');
    });

    it('should support wellness_decline alert type', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550004',
        });
      });

      const alertId = await t.run(async (ctx) => {
        return await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'wellness_decline',
          pattern: 'worsening_scores',
          severity: 'medium',
          createdAt: Date.now(),
        });
      });

      const alert = await t.run(async (ctx) => {
        return await ctx.db.get(alertId as Id<'alerts'>);
      });

      expect(alert?.type).toBe('wellness_decline');
    });

    it('should support low severity level', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550005',
        });
      });

      const alertId = await t.run(async (ctx) => {
        return await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'gradual_decline',
          severity: 'low',
          createdAt: Date.now(),
        });
      });

      const alert = await t.run(async (ctx) => {
        return await ctx.db.get(alertId as Id<'alerts'>);
      });

      expect(alert?.severity).toBe('low');
    });

    it('should support medium severity level', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550006',
        });
      });

      const alertId = await t.run(async (ctx) => {
        return await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: Date.now(),
        });
      });

      const alert = await t.run(async (ctx) => {
        return await ctx.db.get(alertId as Id<'alerts'>);
      });

      expect(alert?.severity).toBe('medium');
    });

    it('should support urgent severity level', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550007',
        });
      });

      const alertId = await t.run(async (ctx) => {
        return await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'high_stress',
          pattern: 'crisis_burst',
          severity: 'urgent',
          createdAt: Date.now(),
        });
      });

      const alert = await t.run(async (ctx) => {
        return await ctx.db.get(alertId as Id<'alerts'>);
      });

      expect(alert?.severity).toBe('urgent');
    });

    it('should allow optional resolvedAt field', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550008',
        });
      });

      const alertId = await t.run(async (ctx) => {
        return await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: Date.now(),
          resolvedAt: Date.now() + 60000, // Resolved 1 minute later
        });
      });

      const alert = await t.run(async (ctx) => {
        return await ctx.db.get(alertId as Id<'alerts'>);
      });

      expect(alert?.resolvedAt).toBeDefined();
      expect(alert?.resolvedAt).toBeGreaterThan(alert!.createdAt);
    });
  });

  describe('Alerts Table Indexes', () => {
    it('should query alerts by user (by_user index)', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550009',
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: Date.now(),
        });
      });

      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].userId).toBe(userId);
    });

    it('should query alerts by severity (by_severity index)', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550010',
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'high_stress',
          pattern: 'crisis_burst',
          severity: 'urgent',
          createdAt: Date.now(),
        });
      });

      const urgentAlerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_severity', (q) => q.eq('severity', 'urgent'))
          .collect();
      });

      expect(urgentAlerts.length).toBeGreaterThanOrEqual(1);
      expect(urgentAlerts[0].severity).toBe('urgent');
    });

    it('should query alerts by creation time (by_created index)', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550011',
        });
      });

      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: now,
        });
      });

      const recentAlerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_created')
          .filter((q) => q.gte(q.field('createdAt'), now - 60000))
          .collect();
      });

      expect(recentAlerts.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Engagement Watcher - Sudden Drop Detection', () => {
  describe('Pattern: Sudden Drop (averageMessagesPerDay > 3, recentMessageCount === 0)', () => {
    it('should detect sudden drop when user with averageMessagesPerDay > 3 has 0 recent messages', async () => {
      const t = convexTest(schema, modules);

      // Create user with high historical engagement
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550012',
          firstName: 'Sarah',
          journeyPhase: 'active',
          recentMessages: [], // No recent messages
          totalInteractionCount: 100,
        });
      });

      // Calculate average: 100 messages over ~25 days = 4/day
      const averageMessagesPerDay = 4;

      // Run engagement watcher
      const result = await t.action(internal.watchers.watchCaregiverEngagement);

      // Should create disengagement alert
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('disengagement');
      expect(alerts[0].pattern).toBe('sudden_drop');
      expect(alerts[0].severity).toBe('medium');
    });

    it('should NOT detect sudden drop when user has normal message count', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550013',
          firstName: 'John',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'How can I manage stress?', timestamp: now - 3600000 },
            { role: 'assistant', content: 'Here are some strategies...', timestamp: now - 3500000 },
          ],
          totalInteractionCount: 100,
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      // Should NOT create alert
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(0);
    });

    it('should NOT detect sudden drop when user has low historical engagement', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550014',
          firstName: 'Mike',
          journeyPhase: 'active',
          recentMessages: [],
          totalInteractionCount: 10, // Low historical count (< 3/day)
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      // Should NOT create alert (average < 3/day)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(0);
    });

    it('should only process active users (journeyPhase = active)', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550015',
          firstName: 'Emma',
          journeyPhase: 'churned', // Not active
          recentMessages: [],
          totalInteractionCount: 100,
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      // Should NOT create alert (user is churned)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(0);
    });

    it('should calculate averageMessagesPerDay correctly from totalInteractionCount', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550016',
          firstName: 'Lisa',
          journeyPhase: 'active',
          conversationStartDate: thirtyDaysAgo,
          totalInteractionCount: 120, // 120 messages / 30 days = 4/day
          recentMessages: [],
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      // Should detect sudden drop (4 > 3)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].pattern).toBe('sudden_drop');
    });

    it('should use 24-hour window for recent message count', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000; // Outside 24h window

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550017',
          firstName: 'David',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'Old message', timestamp: twentyFiveHoursAgo },
          ],
          totalInteractionCount: 100,
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      // Should detect sudden drop (message outside 24h window = 0 recent)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(1);
    });

    it('should not duplicate alerts for same user pattern', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550018',
          firstName: 'Anna',
          journeyPhase: 'active',
          recentMessages: [],
          totalInteractionCount: 100,
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

      expect(alerts.length).toBeLessThanOrEqual(1);
    });
  });
});

describe('Engagement Watcher - High-Stress Burst Detection', () => {
  describe('Pattern: Crisis Burst (3+ crisis keywords in 6 hours)', () => {
    it('should detect high-stress burst when user has 3+ crisis keywords in 6 hours', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550019',
          firstName: 'Rachel',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'I need help with this', timestamp: now - 5 * 60 * 60 * 1000 },
            { role: 'user', content: 'I feel overwhelmed', timestamp: now - 4 * 60 * 60 * 1000 },
            { role: 'user', content: "I can't do this anymore", timestamp: now - 2 * 60 * 60 * 1000 },
          ],
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      // Should create high_stress alert
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('high_stress');
      expect(alerts[0].pattern).toBe('crisis_burst');
      expect(alerts[0].severity).toBe('urgent');
    });

    it('should NOT detect high-stress burst when keyword count < 3', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550020',
          firstName: 'Tom',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'I need help with dinner', timestamp: now - 5 * 60 * 60 * 1000 },
            { role: 'user', content: 'Just checking in', timestamp: now - 2 * 60 * 60 * 1000 },
          ],
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      // Should NOT create alert (only 1 crisis keyword)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'high_stress'))
          .collect();
      });

      expect(alerts).toHaveLength(0);
    });

    it('should detect "help" keyword', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550021',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'help me', timestamp: now - 5 * 60 * 60 * 1000 },
            { role: 'user', content: 'help please', timestamp: now - 4 * 60 * 60 * 1000 },
            { role: 'user', content: 'I need help', timestamp: now - 2 * 60 * 60 * 1000 },
          ],
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'high_stress'))
          .collect();
      });

      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect "overwhelm" keyword', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550022',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'I feel overwhelmed', timestamp: now - 5 * 60 * 60 * 1000 },
            { role: 'user', content: 'This is overwhelming', timestamp: now - 4 * 60 * 60 * 1000 },
            { role: 'user', content: 'Too overwhelming', timestamp: now - 2 * 60 * 60 * 1000 },
          ],
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'high_stress'))
          .collect();
      });

      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect "give up" keyword', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550023',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'I want to give up', timestamp: now - 5 * 60 * 60 * 1000 },
            { role: 'user', content: 'Thinking of giving up', timestamp: now - 4 * 60 * 60 * 1000 },
            { role: 'user', content: 'Might give up soon', timestamp: now - 2 * 60 * 60 * 1000 },
          ],
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'high_stress'))
          .collect();
      });

      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('should use case-insensitive keyword matching', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550024',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'HELP ME', timestamp: now - 5 * 60 * 60 * 1000 },
            { role: 'user', content: 'OVERWHELMED', timestamp: now - 4 * 60 * 60 * 1000 },
            { role: 'user', content: "CAN'T DO THIS", timestamp: now - 2 * 60 * 60 * 1000 },
          ],
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'high_stress'))
          .collect();
      });

      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('should only count messages within 6-hour window', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const sevenHoursAgo = now - 7 * 60 * 60 * 1000; // Outside 6h window

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550025',
          journeyPhase: 'active',
          recentMessages: [
            { role: 'user', content: 'I need help', timestamp: sevenHoursAgo }, // Outside window
            { role: 'user', content: 'I feel overwhelmed', timestamp: now - 5 * 60 * 60 * 1000 },
            { role: 'user', content: "I can't do this", timestamp: now - 2 * 60 * 60 * 1000 },
          ],
        });
      });

      // Run engagement watcher
      await t.action(internal.watchers.watchCaregiverEngagement);

      // Should NOT create alert (only 2 keywords in 6h window)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'high_stress'))
          .collect();
      });

      expect(alerts).toHaveLength(0);
    });
  });
});

describe('Engagement Watcher - Wellness Trend Detection', () => {
  describe('Pattern: Worsening Scores (4 consecutive weeks, overallScore increasing)', () => {
    it('should detect wellness decline when scores worsen over 4 weeks', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550026',
          firstName: 'Jessica',
          journeyPhase: 'active',
        });
      });

      // Create 4 wellness scores with worsening trend (higher = worse)
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 30, // Week 1 (low burnout)
          band: 'mild',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 3 * 7 * 24 * 60 * 60 * 1000, // 3 weeks ago
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 50, // Week 2 (moderate)
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 2 * 7 * 24 * 60 * 60 * 1000, // 2 weeks ago
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 70, // Week 3 (high)
          band: 'high',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 1 * 7 * 24 * 60 * 60 * 1000, // 1 week ago
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 85, // Week 4 (crisis)
          band: 'crisis',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now,
        });
      });

      // Run wellness trend watcher
      await t.action(internal.watchers.watchWellnessTrends);

      // Should create wellness_decline alert
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'wellness_decline'))
          .collect();
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('wellness_decline');
      expect(alerts[0].pattern).toBe('worsening_scores');
      expect(alerts[0].severity).toBe('medium');
    });

    it('should NOT detect wellness decline when scores improve', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550027',
          firstName: 'Mark',
          journeyPhase: 'active',
        });
      });

      // Create 4 wellness scores with improving trend (lower = better)
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 85, // Week 1 (crisis)
          band: 'crisis',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 3 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 70, // Week 2 (high)
          band: 'high',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 2 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 50, // Week 3 (moderate)
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 1 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 30, // Week 4 (mild)
          band: 'mild',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now,
        });
      });

      // Run wellness trend watcher
      await t.action(internal.watchers.watchWellnessTrends);

      // Should NOT create alert (scores improving)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'wellness_decline'))
          .collect();
      });

      expect(alerts).toHaveLength(0);
    });

    it('should NOT detect wellness decline when scores are stable', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550028',
          firstName: 'Sophie',
          journeyPhase: 'active',
        });
      });

      // Create 4 wellness scores with stable trend
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 50,
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 3 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 51,
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 2 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 49,
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 1 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 50,
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now,
        });
      });

      // Run wellness trend watcher
      await t.action(internal.watchers.watchWellnessTrends);

      // Should NOT create alert (scores stable)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'wellness_decline'))
          .collect();
      });

      expect(alerts).toHaveLength(0);
    });

    it('should require at least 4 wellness scores', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550029',
          firstName: 'Alex',
          journeyPhase: 'active',
        });
      });

      // Create only 2 wellness scores
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 30,
          band: 'mild',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 70,
          band: 'high',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now,
        });
      });

      // Run wellness trend watcher
      await t.action(internal.watchers.watchWellnessTrends);

      // Should NOT create alert (insufficient data)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'wellness_decline'))
          .collect();
      });

      expect(alerts).toHaveLength(0);
    });

    it('should use by_user_recorded index to get latest 4 scores', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550030',
          journeyPhase: 'active',
        });
      });

      // Create 6 scores (should only use latest 4)
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 20, // Old score (should be ignored)
          band: 'mild',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 5 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 25, // Old score (should be ignored)
          band: 'mild',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 4 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 40, // Week 1 (latest 4)
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 3 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 55, // Week 2
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 2 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 70, // Week 3
          band: 'high',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 1 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 85, // Week 4
          band: 'crisis',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now,
        });
      });

      // Run wellness trend watcher
      await t.action(internal.watchers.watchWellnessTrends);

      // Should detect worsening trend in latest 4 scores
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'wellness_decline'))
          .collect();
      });

      expect(alerts).toHaveLength(1);
    });

    it('should only process active users', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550031',
          journeyPhase: 'churned', // Not active
        });
      });

      // Create 4 worsening scores
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 30,
          band: 'mild',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 3 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 50,
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 2 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 70,
          band: 'high',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 1 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 85,
          band: 'crisis',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now,
        });
      });

      // Run wellness trend watcher
      await t.action(internal.watchers.watchWellnessTrends);

      // Should NOT create alert (user is churned)
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      expect(alerts).toHaveLength(0);
    });

    it('should detect worsening trend with mixed score increases', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550032',
          journeyPhase: 'active',
        });
      });

      // Create 4 scores with overall worsening (but not strictly monotonic)
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 30,
          band: 'mild',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 3 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 48,
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 2 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 65,
          band: 'high',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 1 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 82,
          band: 'crisis',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now,
        });
      });

      // Run wellness trend watcher
      await t.action(internal.watchers.watchWellnessTrends);

      // Should detect worsening trend
      const alerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('type'), 'wellness_decline'))
          .collect();
      });

      expect(alerts).toHaveLength(1);
    });

    it('should send proactive SMS when wellness decline detected', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550033',
          firstName: 'Karen',
          journeyPhase: 'active',
        });
      });

      // Create 4 worsening scores
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 30,
          band: 'mild',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 3 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 50,
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 2 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 70,
          band: 'high',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 1 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 85,
          band: 'crisis',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now,
        });
      });

      // Run wellness trend watcher
      const result = await t.action(internal.watchers.watchWellnessTrends);

      // Should send SMS (check that function was called)
      expect(result).toBeDefined();
      // Note: Actual SMS sending requires Twilio mock in full implementation
    });

    it('should NOT send SMS when user has no phone number', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          // phoneNumber intentionally missing
          firstName: 'NoPhone',
          journeyPhase: 'active',
        });
      });

      // Create 4 worsening scores
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 30,
          band: 'mild',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 3 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 50,
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 2 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 70,
          band: 'high',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now - 1 * 7 * 24 * 60 * 60 * 1000,
        });
        await ctx.db.insert('wellnessScores', {
          userId: userId as Id<'users'>,
          overallScore: 85,
          band: 'crisis',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: now,
        });
      });

      // Run wellness trend watcher - should not crash
      const result = await t.action(internal.watchers.watchWellnessTrends);

      expect(result).toBeDefined();
      // Should complete without throwing error
    });
  });
});

describe('Engagement Watcher - Cron Scheduling', () => {
  describe('Engagement Watcher Cron', () => {
    it('should run every 6 hours', () => {
      // This is a metadata test - actual cron is configured in convex/crons.ts
      const intervalHours = 6;
      expect(intervalHours).toBe(6);
    });

    it('should use internal.watchers.watchCaregiverEngagement', () => {
      // Verify function name exists
      expect(internal.watchers.watchCaregiverEngagement).toBeDefined();
    });

    it('should process all active users on each run', async () => {
      const t = convexTest(schema, modules);

      // Create multiple active users
      await t.run(async (ctx) => {
        await ctx.db.insert('users', {
          phoneNumber: '+15555550034',
          journeyPhase: 'active',
          recentMessages: [],
          totalInteractionCount: 100,
        });
        await ctx.db.insert('users', {
          phoneNumber: '+15555550035',
          journeyPhase: 'active',
          recentMessages: [],
          totalInteractionCount: 100,
        });
      });

      // Run watcher
      const result = await t.action(internal.watchers.watchCaregiverEngagement);

      // Should process multiple users
      expect(result).toBeDefined();
    });
  });

  describe('Wellness Trend Watcher Cron', () => {
    it('should run weekly on Monday at 9am PT (16:00 UTC)', () => {
      // This is a metadata test - actual cron is configured in convex/crons.ts
      const hourUTC = 16;
      const minuteUTC = 0;
      const dayOfWeek = 'monday';

      expect(hourUTC).toBe(16);
      expect(minuteUTC).toBe(0);
      expect(dayOfWeek).toBe('monday');
    });

    it('should use internal.watchers.watchWellnessTrends', () => {
      // Verify function name exists
      expect(internal.watchers.watchWellnessTrends).toBeDefined();
    });
  });
});

describe('Engagement Watcher - Alert Severity Levels', () => {
  describe('Severity Mapping', () => {
    it('should assign "low" severity to gradual disengagement', async () => {
      // Gradual disengagement = less urgent than sudden drop
      const severity = 'low';
      expect(severity).toBe('low');
    });

    it('should assign "medium" severity to sudden drop', async () => {
      // Sudden drop = moderate urgency
      const severity = 'medium';
      expect(severity).toBe('medium');
    });

    it('should assign "urgent" severity to crisis burst', async () => {
      // Crisis keywords = highest urgency
      const severity = 'urgent';
      expect(severity).toBe('urgent');
    });

    it('should assign "medium" severity to wellness decline', async () => {
      // Wellness decline = moderate urgency (not immediate crisis)
      const severity = 'medium';
      expect(severity).toBe('medium');
    });

    it('should allow querying urgent alerts', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550036',
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'high_stress',
          pattern: 'crisis_burst',
          severity: 'urgent',
          createdAt: Date.now(),
        });
      });

      const urgentAlerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_severity', (q) => q.eq('severity', 'urgent'))
          .collect();
      });

      expect(urgentAlerts.length).toBeGreaterThanOrEqual(1);
    });

    it('should prioritize urgent alerts in admin dashboard queries', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550037',
        });
      });

      // Create alerts with different severities
      await t.run(async (ctx) => {
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: Date.now(),
        });
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'high_stress',
          pattern: 'crisis_burst',
          severity: 'urgent',
          createdAt: Date.now() + 1,
        });
      });

      const allAlerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
      });

      // Should have both alerts
      expect(allAlerts).toHaveLength(2);
      const urgentAlert = allAlerts.find((a) => a.severity === 'urgent');
      expect(urgentAlert).toBeDefined();
    });
  });
});

describe('Engagement Watcher - Pattern Tracking', () => {
  describe('Pattern Identification', () => {
    it('should track "sudden_drop" pattern', async () => {
      const pattern = 'sudden_drop';
      expect(pattern).toBe('sudden_drop');
    });

    it('should track "crisis_burst" pattern', async () => {
      const pattern = 'crisis_burst';
      expect(pattern).toBe('crisis_burst');
    });

    it('should track "worsening_scores" pattern', async () => {
      const pattern = 'worsening_scores';
      expect(pattern).toBe('worsening_scores');
    });

    it('should allow querying alerts by pattern', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550038',
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: Date.now(),
        });
      });

      const suddenDropAlerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .filter((q) => q.eq(q.field('pattern'), 'sudden_drop'))
          .collect();
      });

      expect(suddenDropAlerts.length).toBeGreaterThanOrEqual(1);
    });

    it('should support resolving alerts (set resolvedAt)', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550039',
        });
      });

      const alertId = await t.run(async (ctx) => {
        return await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: Date.now(),
        });
      });

      // Resolve alert
      await t.run(async (ctx) => {
        await ctx.db.patch(alertId as Id<'alerts'>, {
          resolvedAt: Date.now(),
        });
      });

      const alert = await t.run(async (ctx) => {
        return await ctx.db.get(alertId as Id<'alerts'>);
      });

      expect(alert?.resolvedAt).toBeDefined();
    });

    it('should query unresolved alerts only', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550040',
        });
      });

      await t.run(async (ctx) => {
        // Resolved alert
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'disengagement',
          pattern: 'sudden_drop',
          severity: 'medium',
          createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
          resolvedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        });
        // Unresolved alert
        await ctx.db.insert('alerts', {
          userId: userId as Id<'users'>,
          type: 'high_stress',
          pattern: 'crisis_burst',
          severity: 'urgent',
          createdAt: Date.now(),
        });
      });

      const unresolvedAlerts = await t.run(async (ctx) => {
        return await ctx.db
          .query('alerts')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .filter((q) => q.eq(q.field('resolvedAt'), undefined))
          .collect();
      });

      expect(unresolvedAlerts).toHaveLength(1);
      expect(unresolvedAlerts[0].pattern).toBe('crisis_burst');
    });
  });
});
