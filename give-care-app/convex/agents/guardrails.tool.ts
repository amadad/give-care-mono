'use node';

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api } from '../_generated/api';

export const guardrailsTool = createTool({
  args: z.object({
    stage: z.enum(['pre_question', 'post_answer']),
    rule: z.enum(['P1', 'P2', 'P3', 'P4', 'P5', 'P6']),
    ok: z.boolean(),
    notes: z.string().optional(),
  }),
  description: 'Log trauma-informed rule checks. Adds skip reminders and stores violations for review.',
  handler: async (ctx, args) => {
    if (ctx.userId) {
      await ctx.runMutation(api.internal.core.logAuditEntry, {
        actorId: ctx.userId,
        resource: 'guardrail',
        action: args.ok ? 'pass' : 'violation',
        metadata: {
          sessionId: ctx.metadata?.context?.sessionId,
          stage: args.stage,
          rule: args.rule,
          notes: args.notes,
        },
      });
    }

    if (!args.ok && ctx.metadata?.context?.sessionId && ctx.userId) {
      await ctx.runMutation(api.internal.core.appendMessage, {
        sessionId: ctx.metadata.context.sessionId,
        userId: ctx.userId,
        role: 'system',
        text: `Guardrail ${args.rule} flagged (${args.stage}).`,
        metadata: { guardrail: args },
      });
    }

    return { ok: true };
  },
});
