/**
 * Internal Stripe Functions
 * Idempotent webhook processing
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// Inlined from lib/domain/stripeMapping.ts
type StripeSubscriptionStatus = "active" | "canceled" | "past_due";
type SubscriptionPlan = "monthly" | "annual";

interface SubscriptionState {
  userId?: string;
  stripeCustomerId: string;
  planId: SubscriptionPlan;
  status: StripeSubscriptionStatus;
  currentPeriodEnd: number;
  canceledAt?: number;
  gracePeriodEndsAt?: number;
}

function mapStripeEventToSubscription(event: { id: string; type: string; data: { object: any } }): SubscriptionState | null {
  const { type, data } = event;
  const obj = data.object;

  switch (type) {
    case "checkout.session.completed":
      return null;

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const customerId = obj.customer as string;
      const status = obj.status as string;
      const currentPeriodEnd = (obj.current_period_end as number) * 1000;
      const canceledAt = obj.canceled_at ? (obj.canceled_at as number) * 1000 : undefined;

      let subscriptionStatus: StripeSubscriptionStatus = "active";
      if (status === "canceled" || status === "unpaid") {
        subscriptionStatus = "canceled";
      } else if (status === "past_due") {
        subscriptionStatus = "past_due";
      }

      const gracePeriodEndsAt = canceledAt && subscriptionStatus === "canceled"
        ? canceledAt + 30 * 24 * 60 * 60 * 1000
        : undefined;

      const planId = obj.metadata?.planId || obj.metadata?.plan_id || "monthly";

      return {
        stripeCustomerId: customerId,
        planId: (planId === "monthly" || planId === "annual") ? planId : "monthly",
        status: subscriptionStatus,
        currentPeriodEnd,
        canceledAt,
        gracePeriodEndsAt,
      };
    }

    case "customer.subscription.deleted": {
      const customerId = obj.customer as string;
      const canceledAt = Date.now();
      const gracePeriodEndsAt = canceledAt + 30 * 24 * 60 * 60 * 1000;
      const planId = obj.metadata?.planId || obj.metadata?.plan_id || "monthly";

      return {
        stripeCustomerId: customerId,
        planId: (planId === "monthly" || planId === "annual") ? planId : "monthly",
        status: "canceled",
        currentPeriodEnd: (obj.current_period_end as number) * 1000,
        canceledAt,
        gracePeriodEndsAt,
      };
    }

    default:
      return null;
  }
}

/**
 * Apply Stripe webhook event (idempotent)
 * Single mutation - CONVEX_01.md best practice
 */
export const applyStripeEvent = internalMutation({
  args: {
    stripeEventId: v.string(),
    eventType: v.string(),
    eventData: v.any(),
  },
  handler: async (ctx, { stripeEventId, eventType, eventData }) => {
    // Step 1: Idempotency check
    const existingEvent = await ctx.db
      .query("billing_events")
      .withIndex("by_event", (q) => q.eq("stripeEventId", stripeEventId))
      .first();

    if (existingEvent) {
      // Already processed - idempotent
      return { status: "duplicate", eventId: existingEvent._id };
    }

    // Step 2: Map event to subscription state
    const event = {
      id: stripeEventId,
      type: eventType,
      data: { object: eventData },
    };

    const subscriptionState = mapStripeEventToSubscription(event);

    // Handle checkout.session.completed specially for welcome SMS
    if (eventType === "checkout.session.completed") {
      // Extract userId from session metadata
      const metadata = eventData.metadata || {};
      const userId = metadata.userId;

      if (userId) {
        // Record event for idempotency
        await ctx.db.insert("billing_events", {
          stripeEventId,
          userId: userId,
          type: eventType,
          data: eventData,
        });

        // Trigger welcome SMS for new signups
        await ctx.scheduler.runAfter(
          0,
          internal.internal.sms.sendWelcomeSMS,
          { userId: userId }
        );

        return { status: "processed", userId, isNewSubscription: true };
      }

      // No userId in metadata - record and skip
      await ctx.db.insert("billing_events", {
        stripeEventId,
        type: eventType,
        data: eventData,
      });
      return { status: "skipped", reason: "no_user_id_in_checkout" };
    }

    if (!subscriptionState) {
      // Event not relevant for subscription updates
      // Still record it for idempotency
      await ctx.db.insert("billing_events", {
        stripeEventId,
        type: eventType,
        data: eventData,
      });
      return { status: "ignored" };
    }

    // Step 3: Find user by Stripe customer ID
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_customer", (q) =>
        q.eq("stripeCustomerId", subscriptionState.stripeCustomerId)
      )
      .first();

    let userId: string | undefined;

    if (existingSubscription) {
      userId = existingSubscription.userId;
    } else {
      // New subscription - try to find user from event metadata
      // For checkout.session.completed, userId is in session metadata
      // For subscription events, userId might be in customer metadata
      // This is set during checkout session creation
      const metadata = eventData.metadata || {};
      if (metadata.userId) {
        userId = metadata.userId;
      }
    }

    if (!userId) {
      // Cannot process without userId - still record event for idempotency
      await ctx.db.insert("billing_events", {
        stripeEventId,
        type: eventType,
        data: eventData,
      });
      return { status: "skipped", reason: "no_user_id" };
    }

    // Step 4: Upsert subscription (single mutation)
    const isNewSubscription = !existingSubscription;

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        planId: subscriptionState.planId,
        status: subscriptionState.status,
        currentPeriodEnd: subscriptionState.currentPeriodEnd,
        canceledAt: subscriptionState.canceledAt,
        gracePeriodEndsAt: subscriptionState.gracePeriodEndsAt,
      });
    } else if (userId) {
      // Create new subscription
      await ctx.db.insert("subscriptions", {
        userId: userId as any,
        stripeCustomerId: subscriptionState.stripeCustomerId,
        planId: subscriptionState.planId,
        status: subscriptionState.status,
        currentPeriodEnd: subscriptionState.currentPeriodEnd,
        canceledAt: subscriptionState.canceledAt,
        gracePeriodEndsAt: subscriptionState.gracePeriodEndsAt,
      });
    }

    // Step 5: Record billing event for idempotency
    await ctx.db.insert("billing_events", {
      stripeEventId,
      userId: userId as any,
      type: eventType,
      data: eventData,
    });

    return { status: "processed", userId, isNewSubscription };
  },
});

