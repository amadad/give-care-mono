/**
 * Inbound SMS Processing
 * Entry point for all incoming SMS messages
 * Called by Twilio Component via incomingMessageCallback
 */

import { internalMutation } from "./_generated/server";
import { messageValidator } from "@convex-dev/twilio";
import { components, internal } from "./_generated/api";
import {
  detectCrisis,
  isStopRequest,
  isHelpRequest,
  isResubscribeRequest,
  isSignupRequest,
  isBillingRequest,
  isUpdatePaymentRequest,
  isEMACheckInKeyword,
} from "./lib/utils";
import { getCrisisResponse } from "./lib/utils";
import type { Id } from "./_generated/dataModel";

// Inlined feature flags
const FEATURES = {
  SUBSCRIPTION_GATING: process.env.SUBSCRIPTIONS_ENABLED === "true",
} as const;
import type { MutationCtx } from "./_generated/server";

/**
 * Check subscription access (inline - was in subscriptionService)
 * Returns access status and scenario for messaging
 */
async function checkSubscriptionAccess(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<{
  hasAccess: boolean;
  scenario: "new_user" | "active" | "grace_period" | "grace_expired" | "past_due" | "incomplete" | "unknown";
  gracePeriodEndsAt?: number;
}> {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!subscription) {
    return { hasAccess: false, scenario: "new_user" };
  }

  const now = Date.now();

  // Active subscription
  if (subscription.status === "active") {
    return { hasAccess: true, scenario: "active" };
  }

  // Canceled but in grace period
  if (subscription.status === "canceled" && subscription.gracePeriodEndsAt) {
    if (now < subscription.gracePeriodEndsAt) {
      return {
        hasAccess: true,
        scenario: "grace_period",
        gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      };
    } else {
      return { hasAccess: false, scenario: "grace_expired" };
    }
  }

  // Past due
  if (subscription.status === "past_due") {
    return { hasAccess: false, scenario: "past_due" };
  }

  // Unknown/other status
  return { hasAccess: false, scenario: "unknown" };
}

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

    // Step 4: Handle special keywords (before crisis detection)
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

    // Handle EMA check-in keywords
    const emaKeyword = isEMACheckInKeyword(body);
    if (emaKeyword) {
      await handleEMACheckInKeyword(ctx, user._id, emaKeyword);
      return { status: "ema_checkin_updated" };
    }

    // Check if user is awaiting crisis follow-up response
    const metadata = user.metadata as any;
    if (metadata?.awaitingCrisisFollowUp) {
      const { alertId, timestamp } = metadata.awaitingCrisisFollowUp;

      // Only handle if within 48 hours (to avoid stale state)
      if (Date.now() - timestamp < 48 * 60 * 60 * 1000) {
        await handleCrisisFollowUpResponseInline(ctx, user._id, alertId, body);
        return { status: "crisis_followup_response" };
      }
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

    // Step 7: Rate limiting (30 SMS/day) - only for non-crisis messages
    // Crisis messages bypass rate limiting (already handled above)
    const rateLimitKey = user._id; // User ID as string key
    const rateLimitCheck = await ctx.runQuery(components.rateLimiter.lib.checkRateLimit, {
      name: "sms_daily",
      key: rateLimitKey,
      config: {
        kind: "fixed window",
        period: 86400000, // 24 hours in milliseconds
        rate: 30, // 30 messages per day
        capacity: 30,
      },
      count: 1,
    });

    if (!rateLimitCheck.ok) {
      // Rate limit exceeded - send message and return early
      await ctx.scheduler.runAfter(0, internal.internal.sms.sendRateLimitMessage, {
        userId: user._id,
      });
      // Still update last engagement date to track engagement
      await ctx.db.patch(user._id, {
        lastEngagementDate: Date.now(),
      });
      return { status: "rate_limited", retryAfter: rateLimitCheck.retryAfter };
    }

    // Consume rate limit token (user is within limit)
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

    // Step 8: Check subscription access (crisis bypasses this, feature flag controls gating)
    if (FEATURES.SUBSCRIPTION_GATING) {
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
    }

    // Step 9: Update last engagement date
    await ctx.db.patch(user._id, {
      lastEngagementDate: Date.now(),
    });

    // Step 10: Route to agent (async)
    await ctx.scheduler.runAfter(0, internal.internal.agents.processMainAgentMessage, {
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
 * Handle EMA check-in keywords (DAILY, WEEKLY, PAUSE CHECKINS, RESUME)
 */
async function handleEMACheckInKeyword(
  ctx: any,
  userId: any,
  keyword: "daily" | "weekly" | "pause" | "resume"
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) return;

  const metadata = user.metadata || {};
  let checkInFrequency: "daily" | "weekly" | null = null;
  let snoozeUntil: number | undefined = undefined;
  let message = "";

  // Check for high-risk users (2+ crises in 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  // Query with time-based filtering to avoid collecting all events
  // Note: Since we need to filter by createdAt, we collect but limit to recent events
  // In production, consider adding a compound index (userId, createdAt) for better performance
  const recentCrises = await ctx.db
    .query("guardrail_events")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  // Filter in code (acceptable for small result sets per user)
  // Limit to last 100 events per user to prevent unbounded collection
  const filteredCrises = recentCrises
    .filter((e) => e.type === "crisis" && e.createdAt >= thirtyDaysAgo)
    .slice(0, 100); // Safety limit

  const crisisCount = filteredCrises.length;

  if (keyword === "daily") {
    // Auto-downgrade to WEEKLY if high-risk
    if (crisisCount >= 2) {
      checkInFrequency = "weekly";
      message =
        "I'll check in WEEKLY (not daily) to keep things balanced. You can text DAILY, WEEKLY, PAUSE CHECKINS, or RESUME anytime.";
    } else {
      checkInFrequency = "daily";
      message =
        "Okay—I'll check in DAILY. You can text DAILY, WEEKLY, PAUSE CHECKINS, or RESUME anytime.";
    }
  } else if (keyword === "weekly") {
    checkInFrequency = "weekly";
    message =
      "Okay—I'll check in WEEKLY. You can text DAILY, WEEKLY, PAUSE CHECKINS, or RESUME anytime.";
  } else if (keyword === "pause") {
    checkInFrequency = null;
    snoozeUntil = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    message = "Check-ins paused for 7 days. Text RESUME to restart.";
  } else if (keyword === "resume") {
    // Resume with previous frequency or default to WEEKLY
    checkInFrequency = (metadata as any)?.checkInFrequency || "weekly";
    snoozeUntil = undefined;
    message = `Check-ins resumed (${checkInFrequency.toUpperCase()}). You can text DAILY, WEEKLY, PAUSE CHECKINS, or RESUME anytime.`;
  }

  // Update user metadata
  await ctx.db.patch(userId, {
    metadata: {
      ...metadata,
      checkInFrequency,
      snoozeUntil,
    } as any,
  });

  // Send confirmation message
  if (message) {
    await ctx.scheduler.runAfter(0, internal.internal.sms.sendAgentResponse, {
      userId,
      text: message,
    });
  }
}

/**
 * Handle crisis follow-up response inline (in mutation context)
 * Routes to action for SMS sending
 */
async function handleCrisisFollowUpResponseInline(
  ctx: any,
  userId: any,
  alertId: any,
  body: string
): Promise<void> {
  // Clear awaiting state
  const user = await ctx.db.get(userId);
  const metadata = user?.metadata as any;
  await ctx.db.patch(userId, {
    metadata: {
      ...metadata,
      awaitingCrisisFollowUp: undefined,
    } as any,
  });

  // Schedule the response handler (action) to send SMS and record feedback
  await ctx.scheduler.runAfter(0, internal.internal.sms.handleCrisisFollowUpResponse, {
    userId,
    response: body,
    alertId, // Pass the alertId so we don't have to query for it
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

  // Insert alert first to get alertId for follow-up tracking
  const alertId = await ctx.db.insert("alerts", {
    userId,
    type: "crisis",
    severity: crisisResult.severity ?? "medium",
    context: { detection: crisisResult },
    message: crisisMessage,
    channel: "sms",
    status: "pending",
  });

  // Log guardrail event (parallel with alert)
  await ctx.db.insert("guardrail_events", {
    userId,
    type: "crisis",
    severity: crisisResult.severity ?? "medium",
    context: { detection: crisisResult, alertId },
    createdAt: Date.now(),
  });

  // Send crisis response immediately (0 delay scheduler = immediate)
  // This is async but doesn't block the mutation response
  await ctx.scheduler.runAfter(0, internal.twilioMutations.sendCrisisResponseAction, {
    userId,
    isDVHint: crisisResult.isDVHint,
  });

  // Schedule crisis follow-up at T+24 hours with alertId for feedback tracking
  await ctx.scheduler.runAfter(
    24 * 60 * 60 * 1000, // 24 hours in milliseconds
    internal.internal.sms.sendCrisisFollowUpMessage,
    { userId, alertId }
  );
}
