/**
 * Wellness status queries.
 */

import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getStatus = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();
    if (!user) {
      return { summary: 'No wellness data yet.', trend: [], pressureZones: [] };
    }
    const scores = await ctx.db
      .query('scores')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(5);
    if (!scores.length) {
      return { summary: 'No wellness data yet.', trend: [], pressureZones: [] };
    }
    const trend = scores.map((score) => ({
      label: score.band,
      value: score.composite,
      recordedAt: score._creationTime,
    }));
    const latest = scores[0];
    const summary =
      latest.band === 'high'
        ? 'Stress is high. Let’s focus on grounding and breaks.'
        : latest.band === 'medium'
        ? 'You’re managing a lot—keep practicing care routines.'
        : 'You’re in a good place today. Keep nurturing what works.';
    return {
      summary,
      latestScore: latest.composite,
      trend,
      pressureZones: [],
    };
  },
});
