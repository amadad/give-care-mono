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
  normalizePhone,
} from "./lib/utils";

// Inlined feature flags
const FEATURES = {
  SUBSCRIPTION_GATING: process.env.SUBSCRIPTIONS_ENABLED === "true",
} as const;

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
        ctx.runMutation(internal.internal.agents.handleCrisisDetection, {
          userId: user._id,
          crisisResult,
        }),
      ]);
      return { status: "crisis" };
    }

    // Step 3 (non-crisis): Create receipt record (idempotency)
    await ctx.db.insert("inbound_receipts", {
      messageSid,
      userId: user._id,
      receivedAt: Date.now(),
    });

    // Step 7: Rate limiting (10 SMS/day) - only for non-crisis messages
    // Crisis messages bypass rate limiting (already handled above)
    const rateLimitKey = user._id; // User ID as string key
    const rateLimitCheck = await ctx.runQuery(components.rateLimiter.lib.checkRateLimit, {
      name: "sms_daily",
      key: rateLimitKey,
      config: {
        kind: "fixed window",
        period: 86400000, // 24 hours in milliseconds
        rate: 10, // 10 messages per day
        capacity: 10,
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
        rate: 10,
        capacity: 10,
      },
      count: 1,
    });

    // Step 8: Check subscription access (crisis bypasses this, feature flag controls gating)
    if (FEATURES.SUBSCRIPTION_GATING) {
      const access = await ctx.runQuery(
        internal.internal.subscriptions.getAccessScenario,
        { userId: user._id }
      );
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

    // Step 9a: Handle active assessment session responses
    const activeSession = await ctx.runQuery(
      internal.internal.assessments.getActiveSession,
      { userId: user._id }
    );

    if (activeSession) {
      const trimmed = body.trim();
      const lower = trimmed.toLowerCase();
      let answer: number | "skip" | null = null;

      if (lower === "skip") {
        answer = "skip";
      } else {
        const parsed = Number(trimmed);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 5) {
          answer = parsed;
        }
      }

      if (answer === null) {
        await ctx.scheduler.runAfter(0, internal.internal.sms.sendAgentResponse, {
          userId: user._id,
          text: "Please reply with a number 1-5 or say skip.",
        });
        return { status: "assessment_invalid" };
      }

      const result = await ctx.runMutation(
        internal.assessments.processAssessmentAnswer,
        {
          userId: user._id,
          sessionId: activeSession._id,
          answer: answer === "skip" ? "skip" : Number(answer),
        }
      );

      if ((result as any)?.error) {
        await ctx.scheduler.runAfter(0, internal.internal.sms.sendAgentResponse, {
          userId: user._id,
          text: "I couldn't process that answer. Please try again.",
        });
        return { status: "assessment_error" };
      }

      if ((result as any)?.complete) {
        await ctx.scheduler.runAfter(0, internal.internal.sms.sendAgentResponse, {
          userId: user._id,
          text: "Thanks for completing the assessment. I’ll interpret your results now.",
        });
        return { status: "assessment_complete" };
      }

      // Continue to next question
      const nextQuestion = (result as any)?.nextQuestion as string | undefined;
      const progress = (result as any)?.progress as string | undefined;
      if (nextQuestion) {
        const text = progress ? `(${progress}) ${nextQuestion} Reply 1-5 or skip.` : `${nextQuestion} Reply 1-5 or skip.`;
        await ctx.scheduler.runAfter(0, internal.internal.sms.sendAssessmentQuestion, {
          userId: user._id,
          text,
        });
      }

      return { status: "assessment_continue" };
    }

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
  const normalized = normalizePhone(phoneNumber);

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
    .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
    .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
    .order("desc")
    .take(50);

  const crisisCount = recentCrises.length;

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
