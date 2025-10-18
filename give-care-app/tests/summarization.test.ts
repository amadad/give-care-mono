/**
 * Tests for Conversation Summarization (Task 9)
 *
 * Test-Driven Development: WRITE TESTS FIRST
 *
 * Requirements from TASKS.md:
 * 1. Database schema updates (users table: recentMessages, historicalSummary, conversationStartDate, totalInteractionCount)
 * 2. Summarization function splits messages into recent (7 days) and historical (>7 days)
 * 3. Summarizes historical messages if >20 messages (maxTokens: 500)
 * 4. Focus: 'caregiver_challenges_and_progress'
 * 5. Context integration (GiveCareContext gets 4 new fields)
 * 6. Scheduled cron at 3am PT (11:00 UTC) daily
 * 7. Process active users with >30 messages
 * 8. Critical facts never summarized (care recipient name, crisis history)
 * 9. 60-80% token cost reduction for long-term users (>100 messages)
 * 10. Context retained beyond 30-day OpenAI limit
 *
 * Coverage:
 * - Schema validation (8 tests)
 * - Message splitting (7 tests)
 * - Summarization function (10 tests)
 * - Critical facts preservation (6 tests)
 * - Context integration (5 tests)
 * - Cron scheduling (4 tests)
 * - Token cost reduction (5 tests)
 *
 * Total: 45 tests
 */

import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { internal } from '../convex/_generated/api';
import schema from '../convex/schema';
import type { Id } from '../convex/_generated/dataModel';

// Import Convex functions for testing
const modules = import.meta.glob('../convex/**/*.ts');

describe('Conversation Summarization - Schema Validation', () => {
  describe('Users Table Schema Extensions', () => {
    it('should create user with recentMessages array field', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550001',
          firstName: 'Test User',
          recentMessages: [
            {
              role: 'user',
              content: 'How do I manage caregiver stress?',
              timestamp: Date.now(),
            },
            {
              role: 'assistant',
              content: 'Here are some strategies for managing stress...',
              timestamp: Date.now(),
            },
          ],
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user).toBeDefined();
      expect(user?.recentMessages).toHaveLength(2);
      expect(user?.recentMessages?.[0].role).toBe('user');
      expect(user?.recentMessages?.[1].role).toBe('assistant');
    });

    it('should create user with historicalSummary string field', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550002',
          firstName: 'Test User',
          historicalSummary:
            'Caregiver Jane has been caring for mother with dementia for 2 years. Primary challenges: sleep deprivation, financial stress, emotional exhaustion. Progress: started using respite care monthly, joined local support group.',
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.historicalSummary).toBeDefined();
      expect(user?.historicalSummary).toContain('dementia');
      expect(user?.historicalSummary).toContain('respite care');
    });

    it('should create user with conversationStartDate field', async () => {
      const t = convexTest(schema, modules);

      const startDate = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days ago
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550003',
          conversationStartDate: startDate,
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.conversationStartDate).toBe(startDate);
    });

    it('should create user with totalInteractionCount field', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550004',
          totalInteractionCount: 150,
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.totalInteractionCount).toBe(150);
    });

    it('should allow all summarization fields to be optional', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550005',
          firstName: 'New User',
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.recentMessages).toBeUndefined();
      expect(user?.historicalSummary).toBeUndefined();
      expect(user?.conversationStartDate).toBeUndefined();
      expect(user?.totalInteractionCount).toBeUndefined();
    });

    it('should store message objects with correct structure (role, content, timestamp)', async () => {
      const t = convexTest(schema, modules);

      const timestamp = Date.now();
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550006',
          recentMessages: [
            {
              role: 'user',
              content: 'Test message',
              timestamp,
            },
          ],
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      const message = user?.recentMessages?.[0];
      expect(message?.role).toBe('user');
      expect(message?.content).toBe('Test message');
      expect(message?.timestamp).toBe(timestamp);
    });

    it('should handle empty recentMessages array', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550007',
          recentMessages: [],
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.recentMessages).toHaveLength(0);
    });

    it('should handle empty historicalSummary string', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550008',
          historicalSummary: '',
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.historicalSummary).toBe('');
    });
  });
});

describe('Conversation Summarization - Message Splitting', () => {
  describe('Split Messages by Recency (7 days)', () => {
    it('should split messages into recent (< 7 days) and historical (>= 7 days)', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550100',
        });
      });

      // Create conversations
      const recentMsgId = await t.run(async (ctx) => {
        return await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Recent message',
          mode: 'sms',
          timestamp: sixDaysAgo,
        });
      });

      const historicalMsgId = await t.run(async (ctx) => {
        return await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Historical message',
          mode: 'sms',
          timestamp: eightDaysAgo,
        });
      });

      const result = await t.mutation(internal.summarization.splitMessagesByRecency, {
        userId: userId as Id<'users'>,
      });

      expect(result.recentMessages).toHaveLength(1);
      expect(result.historicalMessages).toHaveLength(1);
      expect(result.recentMessages[0].content).toBe('Recent message');
      expect(result.historicalMessages[0].content).toBe('Historical message');
    });

    it('should use 7-day threshold correctly (7 * 24 * 60 * 60 * 1000 milliseconds)', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const exactlySevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const slightlyOlderThanSevenDays = exactlySevenDaysAgo - 1000; // 1 second older

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550101',
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Exactly 7 days',
          mode: 'sms',
          timestamp: exactlySevenDaysAgo,
        });

        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Slightly older',
          mode: 'sms',
          timestamp: slightlyOlderThanSevenDays,
        });
      });

      const result = await t.mutation(internal.summarization.splitMessagesByRecency, {
        userId: userId as Id<'users'>,
      });

      // Exactly 7 days should be historical (>= 7 days)
      expect(result.historicalMessages).toHaveLength(2);
      expect(result.recentMessages).toHaveLength(0);
    });

    it('should return empty arrays if no messages exist', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550102',
        });
      });

      const result = await t.mutation(internal.summarization.splitMessagesByRecency, {
        userId: userId as Id<'users'>,
      });

      expect(result.recentMessages).toHaveLength(0);
      expect(result.historicalMessages).toHaveLength(0);
    });

    it('should only return recent messages if all messages are < 7 days old', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
      const fourDaysAgo = now - 4 * 24 * 60 * 60 * 1000;

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550103',
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Message 1',
          mode: 'sms',
          timestamp: twoDaysAgo,
        });

        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'assistant',
          text: 'Message 2',
          mode: 'sms',
          timestamp: fourDaysAgo,
        });
      });

      const result = await t.mutation(internal.summarization.splitMessagesByRecency, {
        userId: userId as Id<'users'>,
      });

      expect(result.recentMessages).toHaveLength(2);
      expect(result.historicalMessages).toHaveLength(0);
    });

    it('should preserve message order (chronological) in both recent and historical', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
      const twentyDaysAgo = now - 20 * 24 * 60 * 60 * 1000;

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550104',
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Recent 1',
          mode: 'sms',
          timestamp: threeDaysAgo,
        });

        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Recent 2',
          mode: 'sms',
          timestamp: oneDayAgo,
        });

        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Historical 1',
          mode: 'sms',
          timestamp: twentyDaysAgo,
        });

        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Historical 2',
          mode: 'sms',
          timestamp: tenDaysAgo,
        });
      });

      const result = await t.mutation(internal.summarization.splitMessagesByRecency, {
        userId: userId as Id<'users'>,
      });

      // Recent: oldest to newest
      expect(result.recentMessages[0].content).toBe('Recent 1');
      expect(result.recentMessages[1].content).toBe('Recent 2');

      // Historical: oldest to newest
      expect(result.historicalMessages[0].content).toBe('Historical 1');
      expect(result.historicalMessages[1].content).toBe('Historical 2');
    });

    it('should include both user and assistant messages in splits', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550105',
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Recent user message',
          mode: 'sms',
          timestamp: fiveDaysAgo,
        });

        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'assistant',
          text: 'Recent assistant message',
          mode: 'sms',
          timestamp: fiveDaysAgo,
        });

        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Historical user message',
          mode: 'sms',
          timestamp: tenDaysAgo,
        });

        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'assistant',
          text: 'Historical assistant message',
          mode: 'sms',
          timestamp: tenDaysAgo,
        });
      });

      const result = await t.mutation(internal.summarization.splitMessagesByRecency, {
        userId: userId as Id<'users'>,
      });

      expect(result.recentMessages).toHaveLength(2);
      expect(result.historicalMessages).toHaveLength(2);
      expect(result.recentMessages.some((m) => m.role === 'user')).toBe(true);
      expect(result.recentMessages.some((m) => m.role === 'assistant')).toBe(true);
    });

    it('should convert conversations table format to message format (role, content, timestamp)', async () => {
      const t = convexTest(schema, modules);

      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550106',
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Test content',
          mode: 'sms',
          timestamp: twoDaysAgo,
        });
      });

      const result = await t.mutation(internal.summarization.splitMessagesByRecency, {
        userId: userId as Id<'users'>,
      });

      const message = result.recentMessages[0];
      expect(message).toHaveProperty('role');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('timestamp');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Test content');
      expect(message.timestamp).toBe(twoDaysAgo);
    });
  });
});

describe('Conversation Summarization - Summarization Function', () => {
  describe('Generate Summaries for Historical Messages', () => {
    it('should NOT summarize if historical messages <= 20', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550200',
        });
      });

      // Create 20 historical messages
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 20; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      const result = await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      expect(result.historicalSummary).toBe(''); // No summary generated
      expect(result.summarizationTriggered).toBe(false);
    });

    it('should summarize if historical messages > 20', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550201',
        });
      });

      // Create 25 historical messages
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Message about caregiver challenges ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      const result = await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      expect(result.summarizationTriggered).toBe(true);
      expect(result.historicalSummary).toBeDefined();
      expect(result.historicalSummary.length).toBeGreaterThan(0);
    });

    it('should use maxTokens: 500 for summary generation', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550202',
        });
      });

      // Create 30 historical messages
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 30; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Long message about caregiver challenges and progress: ${i.toString().repeat(50)}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      const result = await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      // Rough token estimate: 1 token ≈ 4 characters
      // 500 tokens ≈ 2000 characters
      expect(result.historicalSummary.length).toBeLessThanOrEqual(2500); // Some buffer
    });

    it('should focus on caregiver_challenges_and_progress in summary', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550203',
        });
      });

      // Create 25 historical messages with clear challenges/progress
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      const messages = [
        'I am so exhausted from caring for my mom',
        'Started using respite care last week',
        'Financial stress is overwhelming',
        'Joined a local support group',
        'Sleep deprivation is getting worse',
        // ... continue pattern
      ];

      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: messages[i % messages.length],
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      const result = await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const summary = result.historicalSummary.toLowerCase();
      // Summary should mention challenges OR progress
      const hasRelevantContent =
        summary.includes('challenge') ||
        summary.includes('stress') ||
        summary.includes('progress') ||
        summary.includes('support') ||
        summary.includes('respite');

      expect(hasRelevantContent).toBe(true);
    });

    it('should update users table with recentMessages and historicalSummary', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550204',
        });
      });

      // Create messages
      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

      // Recent message
      await t.run(async (ctx) => {
        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Recent message',
          mode: 'sms',
          timestamp: twoDaysAgo,
        });
      });

      // 25 historical messages to trigger summarization
      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Historical message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.recentMessages).toBeDefined();
      expect(user?.recentMessages).toHaveLength(1);
      expect(user?.historicalSummary).toBeDefined();
      expect(user?.historicalSummary?.length).toBeGreaterThan(0);
    });

    it('should set conversationStartDate if not already set', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550205',
        });
      });

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      // Create first message
      await t.run(async (ctx) => {
        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'First message ever',
          mode: 'sms',
          timestamp: thirtyDaysAgo,
        });
      });

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.conversationStartDate).toBeDefined();
      expect(user?.conversationStartDate).toBeLessThanOrEqual(Date.now());
    });

    it('should update totalInteractionCount with total message count', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550206',
        });
      });

      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

      // 5 recent messages
      for (let i = 0; i < 5; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Recent ${i}`,
            mode: 'sms',
            timestamp: twoDaysAgo + i * 1000,
          });
        });
      }

      // 30 historical messages
      for (let i = 0; i < 30; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Historical ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.totalInteractionCount).toBe(35);
    });

    it('should handle empty message history gracefully', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550207',
        });
      });

      const result = await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      expect(result.recentMessages).toHaveLength(0);
      expect(result.historicalMessages).toHaveLength(0);
      expect(result.historicalSummary).toBe('');
      expect(result.summarizationTriggered).toBe(false);
    });

    it('should preserve existing summary if no new historical messages', async () => {
      const t = convexTest(schema, modules);

      const existingSummary = 'Existing summary from previous run';
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550208',
          historicalSummary: existingSummary,
        });
      });

      // Only recent messages (no historical messages >7 days)
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      await t.run(async (ctx) => {
        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'Recent message',
          mode: 'sms',
          timestamp: twoDaysAgo,
        });
      });

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.historicalSummary).toBe(existingSummary);
    });

    it('should replace existing summary if new historical messages exceed threshold', async () => {
      const t = convexTest(schema, modules);

      const oldSummary = 'Old summary';
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550209',
          historicalSummary: oldSummary,
        });
      });

      // Create 25 new historical messages
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `New historical message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.historicalSummary).not.toBe(oldSummary);
      expect(user?.historicalSummary?.length).toBeGreaterThan(0);
    });
  });
});

describe('Conversation Summarization - Critical Facts Preservation', () => {
  describe('Never Summarize Critical Information', () => {
    it('should preserve care recipient name in recent messages (not summary)', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550300',
          careRecipientName: 'John',
        });
      });

      // Create message mentioning care recipient
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      await t.run(async (ctx) => {
        await ctx.db.insert('conversations', {
          userId: userId as Id<'users'>,
          role: 'user',
          text: 'John had a good day today',
          mode: 'sms',
          timestamp: twoDaysAgo,
        });
      });

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      // Care recipient name should remain in recentMessages, not in summary
      expect(user?.recentMessages?.[0].content).toContain('John');
      expect(user?.careRecipientName).toBe('John'); // Still in users table
    });

    it('should preserve crisis history in users table (lastCrisisEventAt, crisisFollowupCount)', async () => {
      const t = convexTest(schema, modules);

      const crisisTimestamp = Date.now() - 5 * 24 * 60 * 60 * 1000;
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550301',
          lastCrisisEventAt: crisisTimestamp,
          crisisFollowupCount: 2,
        });
      });

      // Create 25 historical messages to trigger summarization
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      // Crisis fields should remain unchanged
      expect(user?.lastCrisisEventAt).toBe(crisisTimestamp);
      expect(user?.crisisFollowupCount).toBe(2);
    });

    it('should preserve firstName, relationship, zipCode in users table', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550302',
          firstName: 'Jane',
          relationship: 'daughter',
          zipCode: '94103',
        });
      });

      // Create 25 historical messages
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.firstName).toBe('Jane');
      expect(user?.relationship).toBe('daughter');
      expect(user?.zipCode).toBe('94103');
    });

    it('should preserve burnout score and band in users table', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550303',
          burnoutScore: 72,
          burnoutBand: 'high',
        });
      });

      // Create 25 historical messages
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.burnoutScore).toBe(72);
      expect(user?.burnoutBand).toBe('high');
    });

    it('should NOT delete old conversation entries from database after summarization', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550304',
        });
      });

      // Create 25 historical messages
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      const beforeCount = await t.run(async (ctx) => {
        const convos = await ctx.db
          .query('conversations')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
        return convos.length;
      });

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const afterCount = await t.run(async (ctx) => {
        const convos = await ctx.db
          .query('conversations')
          .withIndex('by_user', (q) => q.eq('userId', userId as Id<'users'>))
          .collect();
        return convos.length;
      });

      expect(afterCount).toBe(beforeCount); // No deletions
    });

    it('should preserve all recent messages (< 7 days) in full detail', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550305',
        });
      });

      const now = Date.now();
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
      const fourDaysAgo = now - 4 * 24 * 60 * 60 * 1000;
      const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;

      const recentMessages = [
        { text: 'I need help with respite care', timestamp: sixDaysAgo },
        { text: 'Crisis hotline number?', timestamp: fourDaysAgo },
        { text: 'Thank you for the support', timestamp: twoDaysAgo },
      ];

      for (const msg of recentMessages) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: msg.text,
            mode: 'sms',
            timestamp: msg.timestamp,
          });
        });
      }

      await t.action(internal.summarizationActions.updateCaregiverProfile, {
        userId: userId as Id<'users'>,
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId as Id<'users'>);
      });

      expect(user?.recentMessages).toHaveLength(3);
      expect(user?.recentMessages?.[0].content).toBe('I need help with respite care');
      expect(user?.recentMessages?.[1].content).toBe('Crisis hotline number?');
      expect(user?.recentMessages?.[2].content).toBe('Thank you for the support');
    });
  });
});

describe('Conversation Summarization - Context Integration', () => {
  describe('GiveCareContext Schema Updates', () => {
    it('should export GiveCareContext type with 4 new summarization fields', async () => {
      // This test validates TypeScript types, not runtime behavior
      // We'll use a type assertion to check the fields exist

      const { giveCareContextSchema } = await import('../src/context.ts');

      const testContext = {
        userId: 'test_id',
        phoneNumber: '+15555551234',
        userName: null,
        firstName: null,
        relationship: null,
        careRecipientName: null,
        zipCode: null,
        journeyPhase: 'onboarding' as const,
        assessmentInProgress: false,
        assessmentType: null,
        assessmentCurrentQuestion: 0,
        assessmentSessionId: null,
        assessmentResponses: {},
        assessmentRateLimited: false,
        burnoutScore: null,
        burnoutConfidence: null,
        burnoutBand: null,
        pressureZones: [],
        pressureZoneScores: {},
        onboardingAttempts: {},
        onboardingCooldownUntil: null,
        rcsCapable: false,
        deviceType: null,
        consentAt: null,
        languagePreference: 'en',
        // NEW FIELDS (Task 9)
        recentMessages: [
          {
            role: 'user',
            content: 'Test message',
            timestamp: Date.now(),
          },
        ],
        historicalSummary: 'Test summary',
        conversationStartDate: Date.now(),
        totalInteractionCount: 50,
      };

      const parsed = giveCareContextSchema.parse(testContext);

      expect(parsed.recentMessages).toBeDefined();
      expect(parsed.historicalSummary).toBeDefined();
      expect(parsed.conversationStartDate).toBeDefined();
      expect(parsed.totalInteractionCount).toBeDefined();
    });

    it('should make all 4 summarization fields optional with defaults', async () => {
      const { giveCareContextSchema } = await import('../src/context.ts');

      const minimalContext = {
        userId: 'test_id',
        phoneNumber: '+15555551234',
      };

      const parsed = giveCareContextSchema.parse(minimalContext);

      expect(parsed.recentMessages).toBeDefined(); // Should have default
      expect(parsed.historicalSummary).toBeDefined(); // Should have default
      expect(parsed.conversationStartDate).toBeNull(); // Default null
      expect(parsed.totalInteractionCount).toBeNull(); // Default null
    });

    it('should validate recentMessages array structure (role, content, timestamp)', async () => {
      const { giveCareContextSchema } = await import('../src/context.ts');

      const contextWithMessages = {
        userId: 'test_id',
        phoneNumber: '+15555551234',
        recentMessages: [
          {
            role: 'user',
            content: 'Message 1',
            timestamp: Date.now(),
          },
          {
            role: 'assistant',
            content: 'Message 2',
            timestamp: Date.now(),
          },
        ],
      };

      const parsed = giveCareContextSchema.parse(contextWithMessages);

      expect(parsed.recentMessages).toHaveLength(2);
      expect(parsed.recentMessages[0].role).toBe('user');
      expect(parsed.recentMessages[1].role).toBe('assistant');
    });

    it('should validate historicalSummary as string type', async () => {
      const { giveCareContextSchema } = await import('../src/context.ts');

      const contextWithSummary = {
        userId: 'test_id',
        phoneNumber: '+15555551234',
        historicalSummary: 'Caregiver has been using respite care monthly',
      };

      const parsed = giveCareContextSchema.parse(contextWithSummary);

      expect(typeof parsed.historicalSummary).toBe('string');
    });

    it('should validate conversationStartDate as number (timestamp)', async () => {
      const { giveCareContextSchema } = await import('../src/context.ts');

      const timestamp = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const contextWithStartDate = {
        userId: 'test_id',
        phoneNumber: '+15555551234',
        conversationStartDate: timestamp,
      };

      const parsed = giveCareContextSchema.parse(contextWithStartDate);

      expect(typeof parsed.conversationStartDate).toBe('number');
      expect(parsed.conversationStartDate).toBe(timestamp);
    });
  });
});

describe('Conversation Summarization - Cron Scheduling', () => {
  describe('Daily Summarization Job', () => {
    it('should have cron job scheduled at 3am PT (11:00 UTC)', async () => {
      const crons = await import('../convex/crons.ts');
      const cronsDefault = crons.default;

      // Check that cron exists
      expect(cronsDefault).toBeDefined();
      // Note: Actual cron validation requires inspecting Convex deployment
      // This test validates the import works
    });

    it('should process active users with >30 messages', async () => {
      const t = convexTest(schema, modules);

      // Create user with 35 messages
      const userId1 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550400',
          journeyPhase: 'active',
        });
      });

      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 35; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId1 as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      // Create user with only 25 messages (below threshold)
      const userId2 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550401',
          journeyPhase: 'active',
        });
      });

      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId2 as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      const result = await t.action(internal.summarizationActions.summarizeAllUsers, {});

      expect(result.processedCount).toBe(1); // Only user1 processed
      expect(result.skippedCount).toBe(1); // user2 skipped
    });

    it('should skip users with journeyPhase = churned', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550402',
          journeyPhase: 'churned',
        });
      });

      // Create 35 messages
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 35; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      const result = await t.action(internal.summarizationActions.summarizeAllUsers, {});

      expect(result.processedCount).toBe(0);
      expect(result.skippedCount).toBe(1);
    });

    it('should return summary of processed vs skipped users', async () => {
      const t = convexTest(schema, modules);

      // Create 2 active users with enough messages
      const userId1 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550403',
          journeyPhase: 'active',
        });
      });

      const userId2 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550404',
          journeyPhase: 'active',
        });
      });

      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 35; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId1 as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });

          await ctx.db.insert('conversations', {
            userId: userId2 as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: tenDaysAgo + i * 1000,
          });
        });
      }

      const result = await t.action(internal.summarizationActions.summarizeAllUsers, {});

      expect(result.processedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
      expect(result.totalUsers).toBe(2);
    });
  });
});

describe('Conversation Summarization - Token Cost Reduction', () => {
  describe('Validate Token Savings', () => {
    it('should calculate token estimate for full conversation history', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550500',
        });
      });

      // Create 100 messages (simulate long-term user)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 100; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Message ${i}: This is a typical caregiver message with around 20-30 words describing challenges`,
            mode: 'sms',
            timestamp: thirtyDaysAgo + i * 1000 * 60 * 60, // 1 hour apart
          });
        });
      }

      const result = await t.action(internal.summarization.calculateTokenSavings, {
        userId: userId as Id<'users'>,
      });

      expect(result.fullConversationTokens).toBeGreaterThan(0);
      expect(result.withSummarizationTokens).toBeGreaterThan(0);
      expect(result.fullConversationTokens).toBeGreaterThan(result.withSummarizationTokens);
    });

    it('should achieve 60-80% token reduction for users with >100 messages', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550501',
        });
      });

      // Create 150 messages
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 150; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: i % 2 === 0 ? 'user' : 'assistant',
            text: `Message ${i}: Standard caregiver conversation with typical length and content`,
            mode: 'sms',
            timestamp: thirtyDaysAgo + i * 1000 * 60 * 60,
          });
        });
      }

      const result = await t.action(internal.summarization.calculateTokenSavings, {
        userId: userId as Id<'users'>,
      });

      const reductionPercent =
        ((result.fullConversationTokens - result.withSummarizationTokens) /
          result.fullConversationTokens) *
        100;

      expect(reductionPercent).toBeGreaterThanOrEqual(60);
      expect(reductionPercent).toBeLessThanOrEqual(80);
    });

    it('should show minimal savings for users with <30 messages', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550502',
        });
      });

      // Create 25 messages (below summarization threshold)
      const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 25; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: `Message ${i}`,
            mode: 'sms',
            timestamp: fiveDaysAgo + i * 1000 * 60 * 60,
          });
        });
      }

      const result = await t.action(internal.summarization.calculateTokenSavings, {
        userId: userId as Id<'users'>,
      });

      // No summarization, so savings should be 0%
      expect(result.savingsPercent).toBe(0);
    });

    it('should estimate cost savings at scale (1000 users)', async () => {
      const t = convexTest(schema, modules);

      // Simulate aggregate cost for 1000 users
      // Assumption: Average user has 80 messages/month

      const result = await t.mutation(internal.summarization.estimateMonthlyCostSavings, {
        userCount: 1000,
        avgMessagesPerUser: 80,
      });

      expect(result.costWithoutSummarization).toBeGreaterThan(0);
      expect(result.costWithSummarization).toBeGreaterThan(0);
      expect(result.monthlySavings).toBeGreaterThan(0);
      expect(result.costWithSummarization).toBeLessThan(10); // <$10/month as per requirements
    });

    it('should calculate token reduction ratio correctly', async () => {
      const t = convexTest(schema, modules);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555550503',
        });
      });

      // Create 100 messages with known token count
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < 100; i++) {
        await t.run(async (ctx) => {
          await ctx.db.insert('conversations', {
            userId: userId as Id<'users'>,
            role: 'user',
            text: 'This is a test message', // ~5 tokens
            mode: 'sms',
            timestamp: thirtyDaysAgo + i * 1000 * 60 * 60,
          });
        });
      }

      const result = await t.action(internal.summarization.calculateTokenSavings, {
        userId: userId as Id<'users'>,
      });

      const expectedFullTokens = 100 * 5; // 500 tokens
      const expectedWithSummarization = 500 + 7 * 5; // 500 max summary + 7 days recent (35 tokens)

      expect(result.fullConversationTokens).toBeGreaterThanOrEqual(expectedFullTokens * 0.8);
      expect(result.withSummarizationTokens).toBeLessThanOrEqual(
        expectedWithSummarization * 1.2
      );
    });
  });
});
