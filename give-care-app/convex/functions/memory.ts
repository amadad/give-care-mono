import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Users from '../model/users';

export const record = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, { userId, category, content, importance }) => {
    const user = await Users.ensureUser(ctx, { externalId: userId, channel: 'sms' });
    await ctx.db.insert('memories', {
      userId: user._id,
      externalId: userId,
      category,
      content,
      importance,
      embedding: undefined,
      lastAccessedAt: Date.now(),
      accessCount: 0,
    });
  },
});
