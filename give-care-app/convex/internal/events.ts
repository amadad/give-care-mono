/**
 * Internal Event Functions
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Emit event (inline - was in eventService)
 */
async function emitEvent(
  ctx: MutationCtx,
  userId: Id<"users">,
  type: string,
  payload: any
) {
  await ctx.db.insert("events", {
    userId,
    type: type as any,
    payload,
  });
}

/**
 * Emit resource search event
 */
export const emitResourceSearch = internalMutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    category: v.string(),
    zip: v.string(),
  },
  handler: async (ctx, { userId, query, category, zip }) => {
    await emitEvent(ctx, userId, "resource.search", {
      query,
      category,
      zip,
    });
  },
});

