/**
 * Query Batching Infrastructure
 * Batch queries for performance - CONVEX_01.md best practice
 */

import { QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

export interface InboundContext {
  receipt: any | null;
  user: any | null;
  session: any | null;
  quietHours: boolean;
  snoozeUntil?: number;
}

/**
 * Get inbound context (batched queries)
 * Single query with Promise.all for parallel queries - CONVEX_01.md best practice
 */
export async function getInboundContext(
  ctx: QueryCtx,
  messageSid: string,
  phone: string
): Promise<InboundContext> {
  // Batch queries in parallel using Promise.all
  const [receipt, userByPhone, userByExternalId] = await Promise.all([
    // Idempotency check
    ctx.db
      .query("inbound_receipts")
      .withIndex("by_messageSid", (q) => q.eq("messageSid", messageSid))
      .first(),

    // User lookup by phone
    ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first(),

    // User lookup by externalId (for backward compatibility)
    ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", phone))
      .first(),
  ]);

  const user = userByPhone || userByExternalId;

  // Get active session (requires userId, so after user lookup)
  const session = user
    ? await ctx.db
        .query("assessment_sessions")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", user._id).eq("status", "active")
        )
        .first()
    : null;

  // Check quiet hours (8am-9pm local time)
  // TODO: Implement timezone-aware quiet hours check
  const now = new Date();
  const hour = now.getHours();
  const quietHours = hour >= 8 && hour < 21;

  // Check snooze status
  const metadata = user?.metadata || {};
  const snoozeUntil = metadata.snoozeUntil as number | undefined;

  return {
    receipt,
    user,
    session,
    quietHours,
    snoozeUntil,
  };
}

