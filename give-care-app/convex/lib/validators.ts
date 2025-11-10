/**
 * Shared Validators
 *
 * Common validator definitions used across agents and actions
 */

import { v } from 'convex/values';

export const agentContextValidator = v.object({
  userId: v.string(),
  sessionId: v.optional(v.string()),
  locale: v.string(),
  consent: v.object({
    emergency: v.boolean(),
    marketing: v.boolean(),
  }),
  crisisFlags: v.optional(
    v.object({
      active: v.boolean(),
      terms: v.array(v.string()),
    })
  ),
  metadata: v.optional(v.any()),
});

export const channelValidator = v.union(
  v.literal('sms'),
  v.literal('email'),
  v.literal('web')
);
