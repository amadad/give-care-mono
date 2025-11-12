/**
 * Stripe Event Mapping
 * Pure function to map Stripe webhook events to subscription state
 * No Convex dependencies - pure TypeScript
 */

export type StripeSubscriptionStatus = "active" | "canceled" | "past_due";
export type SubscriptionPlan = "monthly" | "annual";

export interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface SubscriptionState {
  userId?: string;
  stripeCustomerId: string;
  planId: SubscriptionPlan;
  status: StripeSubscriptionStatus;
  currentPeriodEnd: number;
  canceledAt?: number;
  gracePeriodEndsAt?: number;
}

/**
 * Map Stripe event to subscription state
 * Pure function - no side effects
 */
export function mapStripeEventToSubscription(
  event: StripeEvent
): SubscriptionState | null {
  const { type, data } = event;
  const obj = data.object;

  switch (type) {
    case "checkout.session.completed": {
      // Extract customer and subscription from checkout session
      const customerId = obj.customer as string;
      const subscriptionId = obj.subscription as string | null;

      if (!subscriptionId) {
        return null; // One-time payment, not a subscription
      }

      // For checkout.session.completed, the subscription will be created/updated
      // via customer.subscription.created/updated events
      // We return null here and let those events handle the subscription
      // The userId is extracted from metadata in the service layer
      return null;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const customerId = obj.customer as string;
      const status = obj.status as string;
      const currentPeriodEnd = (obj.current_period_end as number) * 1000; // Convert to ms
      const canceledAt = obj.canceled_at
        ? (obj.canceled_at as number) * 1000
        : undefined;

      // Map Stripe status to our status
      let subscriptionStatus: StripeSubscriptionStatus = "active";
      if (status === "canceled" || status === "unpaid") {
        subscriptionStatus = "canceled";
      } else if (status === "past_due") {
        subscriptionStatus = "past_due";
      }

      // Calculate grace period (30 days after cancellation)
      const gracePeriodEndsAt =
        canceledAt && subscriptionStatus === "canceled"
          ? canceledAt + 30 * 24 * 60 * 60 * 1000
          : undefined;

      return {
        stripeCustomerId: customerId,
        planId: extractPlanFromMetadata(obj.metadata) || "monthly",
        status: subscriptionStatus,
        currentPeriodEnd,
        canceledAt,
        gracePeriodEndsAt,
      };
    }

    case "customer.subscription.deleted": {
      const customerId = obj.customer as string;
      const canceledAt = Date.now();
      const gracePeriodEndsAt = canceledAt + 30 * 24 * 60 * 60 * 1000; // 30 days

      return {
        stripeCustomerId: customerId,
        planId: extractPlanFromMetadata(obj.metadata) || "monthly",
        status: "canceled",
        currentPeriodEnd: (obj.current_period_end as number) * 1000,
        canceledAt,
        gracePeriodEndsAt,
      };
    }

    default:
      return null; // Event type not relevant for subscription updates
  }
}

/**
 * Extract plan ID from Stripe metadata
 * Pure function
 */
function extractPlanFromMetadata(
  metadata: Record<string, string> | undefined
): SubscriptionPlan | null {
  if (!metadata) {
    return null;
  }

  const planId = metadata.planId || metadata.plan_id;
  if (planId === "monthly" || planId === "annual") {
    return planId as SubscriptionPlan;
  }

  return null;
}

