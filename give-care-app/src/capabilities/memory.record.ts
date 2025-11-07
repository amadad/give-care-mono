import { z } from 'zod';
import { capability } from './factory';

const InputSchema = z.object({
  category: z.enum(['care_routine', 'preference', 'intervention_result', 'crisis_trigger']),
  content: z.string().min(3),
  importance: z.number().min(1).max(10).optional().default(5),
});

export const recordMemoryCapability = capability({
  name: 'memory.record',
  description: 'Store a short caregiver memory for future personalization.',
  costHint: 'low',
  latencyHint: 'low',
  io: { input: InputSchema },
  async run(input, ctx) {
    const entry = InputSchema.parse(input);
    await ctx.store.saveMemoryEntry({
      userId: ctx.context.userId,
      category: entry.category,
      content: entry.content,
      importance: entry.importance,
    });
    return { status: 'saved', category: entry.category };
  },
});
