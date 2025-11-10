'use node';

import { action } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';

const DAY_MS = 24 * 60 * 60 * 1000;
const CATEGORY_TTLS: Record<string, number> = {
  respite: 30 * DAY_MS,
  respite_care: 30 * DAY_MS,
  support_group: 7 * DAY_MS,
  support: 14 * DAY_MS,
  default: 14 * DAY_MS,
};

const ttlForCategory = (category: string) => CATEGORY_TTLS[category] ?? CATEGORY_TTLS.default;

const stubLookup = (category: string, zip: string) => [
  {
    name: `${category} Support Center`,
    address: `${zip.slice(0, 3)} Main St`,
    hours: 'Mon-Sun 8a-8p',
    rating: 4.8,
    source: 'stubbed',
  },
  {
    name: `${category} Community Hub`,
    address: `${zip.slice(0, 3)} Oak Ave`,
    hours: '24/7 hotline',
    rating: 4.7,
    source: 'stubbed',
  },
];

export const searchResources = action({
  args: {
    userId: v.id('users'),
    category: v.string(),
    zip: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ttl = ttlForCategory(args.category);
    const cache = await ctx.runQuery(internal.resources.getResourceLookupCache, {
      category: args.category,
      zip: args.zip,
    });

    if (cache && cache.expiresAt && cache.expiresAt > now) {
      return {
        category: args.category,
        zip: args.zip,
        results: cache.results ?? [],
        cached: true,
        expiresAt: cache.expiresAt,
      };
    }

    const results = stubLookup(args.category, args.zip);
    await ctx.runMutation(internal.resources.recordResourceLookup, {
      userId: args.userId,
      category: args.category,
      zip: args.zip,
      results,
      expiresAt: now + ttl,
    });

    return {
      category: args.category,
      zip: args.zip,
      results,
      cached: false,
      expiresAt: now + ttl,
    };
  },
});
