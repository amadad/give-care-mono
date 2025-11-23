/**
 * Simplified Inbound SMS Processing - Full Agent Architecture
 * Entry point for all incoming SMS messages
 * Routes everything to unified Mira agent
 */

import { internalMutation } from "./_generated/server";
import { messageValidator } from "@convex-dev/twilio";
import { components, internal } from "./_generated/api";
import {
  isStopRequest,
  isHelpRequest,
  isResubscribeRequest,
  isSignupRequest,
  isBillingRequest,
  isUpdatePaymentRequest,
  normalizePhone,
} from "./lib/utils";

// Feature flags
const FEATURES = {
  SUBSCRIPTION_GATING: process.env.SUBSCRIPTIONS_ENABLED === "true",
} as const;

/**
 * Handle incoming message from Twilio Component
 */
export const handleIncomingMessage = internalMutation({
  args: {
    message: messageValidator,
  },
  handler: async (ctx, { message }) => {
    const messageSid = message.sid;
    const from = message.from;
    const body = message.body;

    // Step 1: Idempotency check
    const existingReceipt = await ctx.db
      .query("inbound_receipts")
      .withIndex("by_messageSid", (q) => q.eq("messageSid", messageSid))
      .first();

    if (existingReceipt) {
      return { status: "duplicate" };
    }

    // Step 2: Get or create user
    const user = await getUserOrCreate(ctx, from);

    // Step 3: Handle regulatory keywords (must process before agent)
    if (isStopRequest(body)) {
      await handleStop(ctx, user._id);
      return { status: "stopped" };
    }

    if (isHelpRequest(body)) {
      await handleHelp(ctx, user._id);
      return { status: "help" };
    }

    // Handle subscription-related keywords
    if (isSignupRequest(body)) {
      await handleSignup(ctx, user._id);
      return { status: "signup_initiated" };
    }

    if (isResubscribeRequest(body)) {
      await handleResubscribe(ctx, user._id);
      return { status: "resubscribe_initiated" };
    }

    if (isBillingRequest(body)) {
      await handleBilling(ctx, user._id);
      return { status: "billing_initiated" };
    }

    if (isUpdatePaymentRequest(body)) {
      await handleUpdatePayment(ctx, user._id);
      return { status: "update_payment_initiated" };
    }

    // Step 4: Create receipt record (idempotency)
    await ctx.db.insert("inbound_receipts", {
      messageSid,
      userId: user._id,
      receivedAt: Date.now(),
    });

    // Step 5: Rate limiting (30 SMS/day)
    const rateLimitKey = user._id;
    const rateLimitCheck = await ctx.runQuery(components.rateLimiter.lib.checkRateLimit, {
      name: "sms_daily",
      key: rateLimitKey,
      config: {
        kind: "fixed window",
        period: 86400000,
        rate: 30,
        capacity: 30,
      },
      count: 1,
    });

    if (!rateLimitCheck.ok) {
      await ctx.scheduler.runAfter(0, internal.internal.sms.sendRateLimitMessage, {
        userId: user._id,
      });
      await ctx.db.patch(user._id, {
        lastEngagementDate: Date.now(),
      });
      return { status: "rate_limited", retryAfter: rateLimitCheck.retryAfter };
    }

    // Consume rate limit token
    await ctx.runMutation(components.rateLimiter.lib.rateLimit, {
      name: "sms_daily",
      key: rateLimitKey,
      config: {
        kind: "fixed window",
        period: 86400000,
        rate: 30,
        capacity: 30,
      },
      count: 1,
    });

    // Step 6: Check subscription access (if enabled)
    if (FEATURES.SUBSCRIPTION_GATING) {
      const access = await ctx.runQuery(
        internal.internal.subscriptions.getAccessScenario,
        { userId: user._id }
      );
      if (!access.hasAccess) {
        await ctx.scheduler.runAfter(0, internal.twilioMutations.sendSubscriptionMessageAction, {
          userId: user._id,
          scenario: access.scenario,
          gracePeriodEndsAt: access.gracePeriodEndsAt,
        });
        return { status: "subscription_required", scenario: access.scenario };
      }
    }

    // Step 7: Update last engagement date
    await ctx.db.patch(user._id, {
      lastEngagementDate: Date.now(),
    });

    // Step 7.5: Check onboarding completion (triggers workflow to complete if ready)
    const metadata = user.metadata || {};
    const isOnboardingIncomplete = !metadata.onboardingCompletedAt;

    if (isOnboardingIncomplete) {
      // Trigger onboarding check (workflow handles completion and check-in workflow start)
      await ctx.scheduler.runAfter(0, internal.onboarding.triggerOnboardingCheck, {
        userId: user._id,
      });
    }

    // Step 8: Route to unified agent (handles everything: crisis, assessments, conversation)
    await ctx.scheduler.runAfter(0, internal.agent.chat, {
      userId: user._id,
      message: body,
    });

    return { status: "processed" };
  },
});

/**
 * Get or create user by phone number
 */
async function getUserOrCreate(ctx: any, phoneNumber: string): Promise<any> {
  const normalized = normalizePhone(phoneNumber);

  const existing = await ctx.db
    .query("users")
    .withIndex("by_phone", (q) => q.eq("phone", normalized))
    .first();

  if (existing) {
    return existing;
  }

  const existingByExternalId = await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) => q.eq("externalId", normalized))
    .first();

  if (existingByExternalId) {
    await ctx.db.patch(existingByExternalId._id, {
      phone: normalized,
    });
    return await ctx.db.get(existingByExternalId._id);
  }

  const userId = await ctx.db.insert("users", {
    externalId: normalized,
    phone: normalized,
    channel: "sms",
    locale: "en-US",
    consent: {
      emergency: true,
      marketing: true,
    },
    metadata: {
      onboardingStage: "new",
      onboardingMilestones: [],
    },
  });

  return await ctx.db.get(userId);
}

/**
 * Handle STOP request
 */
async function handleStop(ctx: any, userId: any): Promise<void> {
  const user = await ctx.db.get(userId);
  if (user) {
    await ctx.db.patch(userId, {
      consent: {
        emergency: user.consent?.emergency ?? true,
        marketing: false,
      },
    });
  }

  await ctx.scheduler.runAfter(0, internal.twilioMutations.sendStopConfirmationAction, {
    userId,
  });
}

/**
 * Handle HELP request
 */
async function handleHelp(ctx: any, userId: any): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.twilioMutations.sendHelpMessageAction, {
    userId,
  });
}

/**
 * Handle SIGNUP request
 */
async function handleSignup(ctx: any, userId: any): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.twilioMutations.handleResubscribeAction, {
    userId,
  });
}

/**
 * Handle RESUBSCRIBE request
 */
async function handleResubscribe(ctx: any, userId: any): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.twilioMutations.handleResubscribeAction, {
    userId,
  });
}

/**
 * Handle BILLING request
 */
async function handleBilling(ctx: any, userId: any): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.twilioMutations.handleBillingPortalAction, {
    userId,
  });
}

/**
 * Handle UPDATE PAYMENT request
 */
async function handleUpdatePayment(ctx: any, userId: any): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.twilioMutations.handleBillingPortalAction, {
    userId,
  });
}
