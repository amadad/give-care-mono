/**
 * Agent Simulation Tests
 * 
 * Purpose: Real agent.generateText() calls with tool execution
 * Spec: ARCHITECTURE.md - "Agent Tools Reference" + "Core Features"
 * No Mocks: Uses real OpenAI agents, real Convex tools
 */

import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { api, internal } from '../convex/_generated/api';
import schema from '../convex/schema';

describe('Agent Simulation Tests', () => {
  it('should handle main agent greeting with profile', async () => {
    // ARCHITECTURE.md: "Main Agent - Onboarding flow Turn 1"
    const t = convexTest(schema);

    // Setup user with profile
    const hydrated = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_agent_test_1',
        channel: 'sms',
      },
    });

    await t.mutation(api.functions.context.persist, {
      context: {
        ...hydrated,
        metadata: {
          profile: {
            firstName: 'Sarah',
            careRecipientName: 'Dad',
          },
          journeyPhase: 'active',
          totalInteractionCount: 10,
        },
      },
    });

    // Run main agent
    const result = await t.action(internal.agents.main.runMainAgent, {
      input: { text: 'Hi, I need help' },
      context: hydrated,
    });

    // Verify response uses profile
    expect(result.text).toContain('Sarah');
    expect(result.text.length).toBeLessThanOrEqual(160); // SMS constraint
  });

  it('should use searchResources tool when asked', async () => {
    // ARCHITECTURE.md: "Agent Tools - searchResources for local caregiving services"
    const t = convexTest(schema);

    const hydrated = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_agent_test_2',
        channel: 'sms',
      },
    });

    await t.mutation(api.functions.context.persist, {
      context: {
        ...hydrated,
        metadata: {
          profile: {
            zipCode: '90210',
          },
        },
      },
    });

    const result = await t.action(internal.agents.main.runMainAgent, {
      input: { text: 'I need respite care near me' },
      context: hydrated,
    });

    // Verify tool was called and results included
    expect(result.toolCalls).toBeDefined();
    expect(result.toolCalls.some((tc) => tc.toolName === 'searchResources')).toBe(true);
    expect(result.text).toContain('respite'); // Response mentions search term
  });

  it('should use recordMemory tool proactively', async () => {
    // ARCHITECTURE.md: "Working Memory System - Agent learns care routine/preference/trigger"
    const t = convexTest(schema);

    const hydrated = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_agent_test_3',
        channel: 'sms',
      },
    });

    const result = await t.action(internal.agents.main.runMainAgent, {
      input: { text: 'My mom always wants her bath at 9am with lavender soap' },
      context: hydrated,
    });

    // Verify agent recorded the care routine
    const memories = await t.run(async (ctx) => {
      const user = await ctx.db
        .query('users')
        .withIndex('by_externalId', (q) => q.eq('externalId', 'sim_agent_test_3'))
        .unique();

      return ctx.db
        .query('memories')
        .filter((q) => q.eq(q.field('userId'), user!._id))
        .collect();
    });

    expect(memories.length).toBeGreaterThan(0);
    expect(memories.some((m) => m.category === 'care_routine')).toBe(true);
  });

  it('should detect crisis and use crisis agent', async () => {
    // ARCHITECTURE.md: "Crisis Detection - Detect crisis keywords, provide 988 resources"
    const t = convexTest(schema);

    const hydrated = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_agent_test_4',
        channel: 'sms',
      },
    });

    const result = await t.action(internal.agents.crisis.runCrisisAgent, {
      input: { text: "I can't do this anymore, I'm done" },
      context: {
        ...hydrated,
        crisisFlags: {
          active: true,
          terms: ['done', 'cant do this'],
        },
      },
    });

    // ARCHITECTURE.md: "Crisis Agent - Provide 988/741741/911 resources"
    expect(result.text).toContain('988');
    expect(result.text).toContain('741741');
    
    // Verify crisis event logged
    const alerts = await t.run(async (ctx) => {
      const user = await ctx.db
        .query('users')
        .withIndex('by_externalId', (q) => q.eq('externalId', 'sim_agent_test_4'))
        .unique();

      return ctx.db
        .query('alerts')
        .filter((q) => q.eq(q.field('userId'), user!._id))
        .collect();
    });

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].severity).toBe('high');
  });

  it('should handle edge case: very long message (>160 chars)', async () => {
    // Edge case: Message exceeds SMS limit
    // Expected: Agent should compress response or split into multiple
    const t = convexTest(schema);

    const hydrated = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_agent_test_5',
        channel: 'sms',
      },
    });

    const longMessage = 'I need help with '.repeat(100); // Very long

    const result = await t.action(internal.agents.main.runMainAgent, {
      input: { text: longMessage },
      context: hydrated,
    });

    // ARCHITECTURE.md: "Communication Style - SMS ≤150 chars"
    // If response is too long, should be handled gracefully
    expect(result.text.length).toBeLessThanOrEqual(160);
  });

  it('should handle edge case: rapid message burst', async () => {
    // Edge case: Multiple messages in quick succession
    // Expected: Rate limiting should prevent abuse
    const t = convexTest(schema);

    const hydrated = await t.mutation(api.functions.context.hydrate, {
      user: {
        externalId: 'sim_agent_test_6',
        channel: 'sms',
      },
    });

    // Send 10 messages rapidly
    const promises = Array.from({ length: 10 }, (_, i) =>
      t.action(internal.agents.main.runMainAgent, {
        input: { text: `Message ${i}` },
        context: hydrated,
      })
    );

    const results = await Promise.allSettled(promises);

    // ARCHITECTURE.md: "Rate Limiting - 5 SMS/5min per user"
    // Some should succeed, some should be rate limited
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    expect(succeeded).toBeLessThanOrEqual(5); // Max 5 per 5 min
    expect(failed).toBeGreaterThan(0); // Some rejected
  });
});
