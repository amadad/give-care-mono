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
    token: v.string(),
    user: v.object({
      externalId: v.string(),
      channel: channelValidator,
      locale: v.optional(v.string()),
      phone: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { token, user }) => {
    requireHarnessToken(token);
    return ContextModel.hydrate(ctx, user);
  },
});

export const persist = mutation({
  args: {
    token: v.string(),
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
  handler: async (ctx, { token, context }) => {
    requireHarnessToken(token);
    await ContextModel.persist(ctx, context);
  },
});
