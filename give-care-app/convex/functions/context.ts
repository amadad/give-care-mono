import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as ContextModel from '../model/context';
import { requireHarnessToken } from '../model/security';

export const channelValidator = v.union(v.literal('sms'), v.literal('web'));

const consentValidator = v.object({ emergency: v.boolean(), marketing: v.boolean() });
const promptHistoryValidator = v.array(v.object({ fieldId: v.string(), text: v.string() }));
const budgetValidator = v.object({ maxInputTokens: v.number(), maxOutputTokens: v.number(), maxTools: v.number() });

export const hydrate = mutation({
  args: {
    user: v.object({
      externalId: v.string(),
      channel: channelValidator,
      locale: v.optional(v.string()),
      phone: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { user }) => {
    return ContextModel.hydrate(ctx, user);
  },
});

export const persist = mutation({
  args: {
    context: v.object({
      userId: v.string(),
      sessionId: v.string(),
      locale: v.string(),
      policyBundle: v.string(),
      promptHistory: promptHistoryValidator,
      consent: consentValidator,
      metadata: v.any(),
      budget: budgetValidator,
      lastAssessment: v.optional(v.object({ definitionId: v.string(), score: v.number() })),
      crisisFlags: v.optional(v.object({ active: v.boolean(), terms: v.array(v.string()) })),
    }),
  },
  handler: async (ctx, { context }) => {
    await ContextModel.persist(ctx, context);
  },
});
