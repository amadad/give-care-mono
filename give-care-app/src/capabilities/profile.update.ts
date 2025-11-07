import { z } from 'zod';
import { capability } from './factory';
import type { Channel } from '../shared/types';

const profileInputSchema = z.object({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()])
});

export const updateProfile = capability({
  name: 'profile.update',
  description: 'Update a user profile field',
  costHint: 'low',
  latencyHint: 'low',
  requiresConsent: true,
  io: { input: profileInputSchema },
  async run(args, { store, userId, context, trace }) {
    const { field, value } = profileInputSchema.parse(args);
    const channel: Channel = (context.metadata?.channel === 'sms' || context.metadata?.channel === 'web')
      ? context.metadata.channel
      : 'web';
    await store.saveOutbound({ userId, channel, text: `profile.update ${field}=${value}`, traceId: trace.id });
    return { success: true };
  },
});
