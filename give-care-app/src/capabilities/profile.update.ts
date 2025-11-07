import { z } from 'zod';
import { capability } from './factory';

export const updateProfile = capability({
  name: 'profile.update',
  description: 'Update a user profile field',
  costHint: 'low',
  latencyHint: 'low',
  requiresConsent: true,
  io: {
    input: z.object({ field: z.string(), value: z.union([z.string(), z.number(), z.boolean()]) }),
  },
  async run({ field, value }, { store, userId, context, trace }) {
    const channel = (context.metadata?.channel as string) ?? 'web';
    await store.saveOutbound({ userId, channel, text: `profile.update ${field}=${value}`, traceId: trace.id });
    return { success: true };
  },
});
