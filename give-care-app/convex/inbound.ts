/**
 * Inbound SMS Processing
 * Entry point for all incoming SMS messages
 * Called by Twilio Component via incomingMessageCallback
 */

import { internalMutation } from "./_generated/server";
import { messageValidator } from "@convex-dev/twilio";
import { internal } from "./_generated/api";
import {
  detectCrisis,
  isStopRequest,
  isHelpRequest,
  isResubscribeRequest,
  isSignupRequest,
  isBillingRequest,
  isUpdatePaymentRequest
} from "./lib/utils";
import { getCrisisResponse } from "./lib/utils";
import { checkSubscriptionAccess } from "./lib/services/subscriptionService";

/**
 * Handle incoming message from Twilio Component
 * Component automatically saves message and verifies signature
 */
export const handleIncomingMessage = internalMutation({
  args: {
    message: messageValidator,
  },
  handler: async (ctx, { message }) => {
    // Component automatically saves message to its sandboxed table
    // We process it here for routing and agent execution

    const messageSid = message.sid;
    const from = message.from;
    const body = message.body;

    // Step 1: Idempotency check (using our own receipts table)
    const existingReceipt = await ctx.db
      .query("inbound_receipts")
      .withIndex("by_messageSid", (q) => q.eq("messageSid", messageSid))
      .first();

    if (existingReceipt) {
      // Duplicate - already processed
      return { status: "duplicate" };
    }

    // Step 2: User resolution (can be optimized with caching)
    const user = await getUserOrCreate(ctx, from);

    // Step 3: Create receipt record (idempotency) - done in parallel with crisis check
    // For crisis path, we'll create receipt after crisis handling to minimize latency
    // For non-crisis path, create receipt before processing

    // Step 4: Rate limiting (10 SMS/day)
    // Note: Rate limiter component check would go here
    // For now, allowing all messages (can be enhanced later)

    // Step 5: Handle special keywords (before crisis detection)
    // Note: Keywords are checked in priority order
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

    // Step 6: Crisis detection (deterministic, no LLM)
    // Fast-path: Check crisis BEFORE creating receipt to minimize latency
    const crisisResult = detectCrisis(body);
    if (crisisResult.isCrisis) {
      // Crisis always available - bypass subscription check
      // Create receipt in parallel with crisis handling
      await Promise.all([
        ctx.db.insert("inbound_receipts", {
          messageSid,
          userId: user._id,
          receivedAt: Date.now(),
        }),
        handleCrisis(ctx, user._id, crisisResult),
      ]);
      return { status: "crisis" };
    }

    // Step 3 (non-crisis): Create receipt record (idempotency)
    await ctx.db.insert("inbound_receipts", {
      messageSid,
      userId: user._id,
      receivedAt: Date.now(),
    });

    // Step 7: Check subscription access (crisis bypasses this)
    const access = await checkSubscriptionAccess(ctx, user._id);
    if (!access.hasAccess) {
      // No access - send appropriate message based on scenario
      await ctx.scheduler.runAfter(0, internal.twilioMutations.sendSubscriptionMessageAction, {
        userId: user._id,
        scenario: access.scenario,
        gracePeriodEndsAt: access.gracePeriodEndsAt,
      });
      return { status: "subscription_required", scenario: access.scenario };
    }

    // Step 8: Update last engagement date
    await ctx.db.patch(user._id, {
      lastEngagementDate: Date.now(),
    });

    // Step 9: Route to agent (async)
    await ctx.scheduler.runAfter(0, internal.agents.processMainAgentMessage, {
      userId: user._id,
      body,
    });

    return { status: "processed" };
  },
});

/**
 * Get or create user by phone number
 * Preserves E.164 format from Twilio
 */
async function getUserOrCreate(ctx: any, phoneNumber: string): Promise<any> {
  // Normalize phone number to E.164 format
  // Twilio sends E.164 format (+1XXXXXXXXXX), preserve it
  let normalized: string;
  if (phoneNumber.startsWith("+")) {
    // Already E.164 format
    normalized = phoneNumber;
  } else {
    // Add +1 prefix for US numbers (remove all non-digits first)
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length === 10) {
      normalized = `+1${digits}`;
    } else if (digits.length === 11 && digits[0] === "1") {
      normalized = `+${digits}`;
    } else {
      // Fallback: use as-is if doesn't match expected format
      normalized = phoneNumber;
    }
  }

  // Try to find existing user by phone
  const existing = await ctx.db
    .query("users")
    .withIndex("by_phone", (q) => q.eq("phone", normalized))
    .first();

  if (existing) {
    return existing;
  }

  // Also check by externalId (for backward compatibility)
  const existingByExternalId = await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) => q.eq("externalId", normalized))
    .first();

  if (existingByExternalId) {
    // Update phone field to E.164 format
    await ctx.db.patch(existingByExternalId._id, {
      phone: normalized,
    });
    return await ctx.db.get(existingByExternalId._id);
  }

  // Create new user
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
  // Update consent
  const user = await ctx.db.get(userId);
  if (user) {
    await ctx.db.patch(userId, {
      consent: {
        emergency: user.consent?.emergency ?? true,
        marketing: false,
      },
    });
  }

  // Send confirmation (async)
  await ctx.scheduler.runAfter(0, internal.twilioMutations.sendStopConfirmationAction, {
    userId,
  });
}

/**
 * Handle HELP request
 */
async function handleHelp(ctx: any, userId: any): Promise<void> {
  // Send help message (async)
  await ctx.scheduler.runAfter(0, internal.twilioMutations.sendHelpMessageAction, {
    userId,
  });
}

/**
 * Handle SIGNUP request (for new users)
 * Creates Stripe checkout session and sends URL via SMS
 */
async function handleSignup(ctx: any, userId: any): Promise<void> {
  // Use same handler as resubscribe - it handles both new and returning users
  await ctx.scheduler.runAfter(0, internal.twilioMutations.handleResubscribeAction, {
    userId,
  });
}

/**
 * Handle RESUBSCRIBE request
 * Creates Stripe checkout session and sends URL via SMS
 */
async function handleResubscribe(ctx: any, userId: any): Promise<void> {
  // Schedule action to handle resubscribe (creates checkout and sends SMS)
  await ctx.scheduler.runAfter(0, internal.twilioMutations.handleResubscribeAction, {
    userId,
  });
}

/**
 * Handle BILLING request
 * Sends Stripe billing portal link if user has Stripe customer ID
 */
async function handleBilling(ctx: any, userId: any): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.twilioMutations.handleBillingPortalAction, {
    userId,
  });
}

/**
 * Handle UPDATE PAYMENT request
 * Same as billing - sends portal link for updating payment method
 */
async function handleUpdatePayment(ctx: any, userId: any): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.twilioMutations.handleBillingPortalAction, {
    userId,
  });
}

/**
 * Handle crisis detection
 * Fast-path: Deterministic response, no LLM, <600ms target
 * Optimized: Precompute response, batch DB operations, immediate scheduling
 */
async function handleCrisis(
  ctx: any,
  userId: any,
  crisisResult: any
): Promise<void> {
  // Precompute crisis response (no DB dependency)
  const crisisMessage = getCrisisResponse(crisisResult.isDVHint);

  // Batch database operations (parallel inserts - CONVEX_01.md optimization)
  await Promise.all([
    // Log crisis event
    ctx.db.insert("alerts", {
      userId,
      type: "crisis",
      severity: crisisResult.severity ?? "medium",
      context: { detection: crisisResult },
      message: crisisMessage,
      channel: "sms",
      status: "pending",
    }),
    // Log guardrail event
    ctx.db.insert("guardrail_events", {
      userId,
      type: "crisis",
      severity: crisisResult.severity ?? "medium",
      context: { detection: crisisResult },
      createdAt: Date.now(),
    }),
  ]);

  // Send crisis response immediately (0 delay scheduler = immediate)
  // This is async but doesn't block the mutation response
  await ctx.scheduler.runAfter(0, internal.twilioMutations.sendCrisisResponseAction, {
    userId,
    isDVHint: crisisResult.isDVHint,
  });

  // Schedule follow-up check-in (next day)
  await ctx.scheduler.runAfter(
    86400000, // 24 hours
    internal.workflows.scheduleCrisisFollowUp,
    { userId }
  );
}
