/**
 * Event Service
 * Convex-aware service for event emission
 */

import { MutationCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

export type EventType =
  | "intervention.try"
  | "intervention.success"
  | "intervention.skip"
  | "resource.open"
  | "resource.search"
  | "assessment.completed"
  | "assessment.started"
  | "profile.updated"
  | "memory.recorded"
  | "check_in.completed";

/**
 * Emit an event
 * Single mutation - CONVEX_01.md best practice
 */
export async function emitEvent(
  ctx: MutationCtx,
  userId: Id<"users">,
  type: EventType,
  payload: any
): Promise<void> {
  await ctx.db.insert("events", {
    userId,
    type,
    payload,
  });
}

