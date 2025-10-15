/**
 * Admin Dashboard Functions
 *
 * Queries and mutations for the admin dashboard at admin.givecare.app
 *
 * Security: Should be protected by Convex Auth (admin role required)
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get system-wide metrics for dashboard home page
 */
export const getSystemMetrics = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    // Active users (contacted in last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeUsers = users.filter(u =>
      u.lastContactAt && u.lastContactAt > sevenDaysAgo
    );

    // Crisis users (burnout >= 80)
    const crisisUsers = users.filter(u =>
      u.burnoutScore && u.burnoutScore >= 80
    );

    // Average burnout score
    const usersWithScores = users.filter(u => u.burnoutScore !== undefined);
    const avgBurnoutScore = usersWithScores.length > 0
      ? usersWithScores.reduce((sum, u) => sum + (u.burnoutScore || 0), 0) / usersWithScores.length
      : 0;

    // Response time (p95) - get from recent conversations
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentConvos = await ctx.db
      .query("conversations")
      .filter(q => q.gte(q.field("timestamp"), oneDayAgo))
      .collect();

    const latencies = recentConvos
      .filter(c => c.latency !== undefined)
      .map(c => c.latency!)
      .sort((a, b) => a - b);

    const p95Latency = latencies.length > 0
      ? latencies[Math.floor(latencies.length * 0.95)]
      : 0;

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      crisisAlerts: crisisUsers.length,
      avgBurnoutScore: Math.round(avgBurnoutScore * 10) / 10,
      p95ResponseTime: Math.round(p95Latency),
      subscriptionBreakdown: {
        active: users.filter(u => u.subscriptionStatus === "active" || u.subscriptionStatus === "trialing").length,
        incomplete: users.filter(u => u.subscriptionStatus === "incomplete").length,
        pastDue: users.filter(u => u.subscriptionStatus === "past_due" || u.subscriptionStatus === "unpaid").length,
        canceled: users.filter(u => u.subscriptionStatus === "canceled" || u.subscriptionStatus === "incomplete_expired").length,
        none: users.filter(u => !u.subscriptionStatus || u.subscriptionStatus === "none").length,
      }
    };
  }
});

/**
 * Get all users with filtering, search, and pagination
 */
export const getAllUsers = query({
  args: {
    search: v.optional(v.string()),
    journeyPhase: v.optional(v.string()),
    burnoutBand: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    limit: v.number(),
    cursor: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit, 1), 200);

    // Build query with index (can only use one index)
    // Priority: journeyPhase > burnoutBand > subscriptionStatus
    let usersQuery;

    if (args.journeyPhase) {
      usersQuery = ctx.db
        .query("users")
        .withIndex("by_journey", q => q.eq("journeyPhase", args.journeyPhase));

      // Apply additional filters
      if (args.burnoutBand) {
        usersQuery = usersQuery.filter(q =>
          q.eq(q.field("burnoutBand"), args.burnoutBand)
        );
      }
      if (args.subscriptionStatus) {
        usersQuery = usersQuery.filter(q =>
          q.eq(q.field("subscriptionStatus"), args.subscriptionStatus)
        );
      }
    } else if (args.burnoutBand) {
      usersQuery = ctx.db
        .query("users")
        .withIndex("by_burnout_band", q => q.eq("burnoutBand", args.burnoutBand));

      if (args.subscriptionStatus) {
        usersQuery = usersQuery.filter(q =>
          q.eq(q.field("subscriptionStatus"), args.subscriptionStatus)
        );
      }
    } else if (args.subscriptionStatus) {
      usersQuery = ctx.db
        .query("users")
        .withIndex("by_subscription", q => q.eq("subscriptionStatus", args.subscriptionStatus));
    } else {
      usersQuery = ctx.db.query("users");
    }

    const searchTerm = args.search?.trim();
    const mapUser = (u: any) => ({
      _id: u._id,
      firstName: u.firstName || "Unknown",
      relationship: u.relationship,
      phoneNumber: u.phoneNumber,
      burnoutScore: u.burnoutScore,
      burnoutBand: u.burnoutBand,
      journeyPhase: u.journeyPhase || "onboarding",
      subscriptionStatus: u.subscriptionStatus || "none",
      lastContactAt: u.lastContactAt,
      createdAt: u.createdAt
    });

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matches: any[] = [];
      let cursor: string | null | undefined = args.cursor || null;
      let continueCursor: string | null = null;
      let isDone = false;

      while (matches.length < limit) {
        const page = await usersQuery
          .order("desc")
          .paginate({ numItems: limit, cursor: cursor ?? null });

        const pageMatches = page.page.filter(u => {
          const nameMatches = u.firstName && u.firstName.toLowerCase().includes(searchLower);
          const phoneMatches = u.phoneNumber && u.phoneNumber.includes(searchLower);
          const recipientMatches = u.careRecipientName && u.careRecipientName.toLowerCase().includes(searchLower);
          return Boolean(nameMatches || phoneMatches || recipientMatches);
        });

        matches.push(...pageMatches);

        if (page.isDone) {
          continueCursor = null;
          isDone = true;
          break;
        }

        if (matches.length >= limit) {
          continueCursor = page.continueCursor;
          break;
        }

        cursor = page.continueCursor;
      }

      const sliced = matches.slice(0, limit);

      return {
        users: sliced.map(mapUser),
        continueCursor,
        isDone: continueCursor === null || isDone
      };
    }

    const results = await usersQuery
      .order("desc")
      .paginate({ numItems: limit, cursor: args.cursor || null });

    return {
      users: results.page.map(mapUser),
      continueCursor: results.continueCursor,
      isDone: results.isDone
    };
  }
});

/**
 * Get detailed info for a single user
 */
export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get recent conversations (last 10)
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_time", q => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    // Get wellness score history (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const wellnessHistory = await ctx.db
      .query("wellnessScores")
      .withIndex("by_user_recorded", q => q.eq("userId", args.userId))
      .filter(q => q.gte(q.field("recordedAt"), thirtyDaysAgo))
      .collect();

    // Get assessment history (last 5 completed)
    const assessments = await ctx.db
      .query("assessmentSessions")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("completed"), true))
      .order("desc")
      .take(5);

    return {
      user,
      conversations: conversations.map(c => ({
        _id: c._id,
        role: c.role,
        text: c.text,
        timestamp: c.timestamp,
        agentName: c.agentName,
        latency: c.latency
      })),
      wellnessHistory: wellnessHistory.map(w => ({
        score: w.overallScore,
        recordedAt: w.recordedAt,
        band: w.band,
        pressureZones: w.pressureZones
      })),
      assessments: assessments.map(a => ({
        _id: a._id,
        type: a.type,
        overallScore: a.overallScore,
        completedAt: a.completedAt
      }))
    };
  }
});

/**
 * Get crisis alerts (users in crisis band + pending follow-ups)
 */
export const getCrisisAlerts = query({
  args: {},
  handler: async (ctx) => {
    // Users in crisis band (burnout >= 80)
    const crisisUsers = await ctx.db
      .query("users")
      .withIndex("by_burnout_band", q => q.eq("burnoutBand", "crisis"))
      .collect();

    // Users pending 24hr crisis follow-up (lastCrisisEventAt within last 7 days, crisisFollowupCount < 7)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const allUsers = await ctx.db.query("users").collect();
    const pendingFollowups = allUsers.filter(u =>
      u.lastCrisisEventAt &&
      u.lastCrisisEventAt > sevenDaysAgo &&
      (u.crisisFollowupCount || 0) < 7
    );

    // Calculate next follow-up time for each
    const pendingWithTimers = pendingFollowups.map(u => {
      const hoursSinceCrisis = (Date.now() - (u.lastCrisisEventAt || 0)) / (1000 * 60 * 60);
      const nextFollowupHours = 24 * ((u.crisisFollowupCount || 0) + 1); // 24h, 48h, 72h, etc.
      const hoursUntilNext = Math.max(0, nextFollowupHours - hoursSinceCrisis);

      return {
        _id: u._id,
        firstName: u.firstName || "Unknown",
        phoneNumber: u.phoneNumber,
        burnoutScore: u.burnoutScore,
        lastCrisisEventAt: u.lastCrisisEventAt,
        crisisFollowupCount: u.crisisFollowupCount || 0,
        hoursUntilNextFollowup: Math.round(hoursUntilNext * 10) / 10
      };
    });

    return {
      crisisUsers: crisisUsers.map(u => ({
        _id: u._id,
        firstName: u.firstName || "Unknown",
        phoneNumber: u.phoneNumber,
        burnoutScore: u.burnoutScore,
        pressureZones: u.pressureZones,
        lastContactAt: u.lastContactAt
      })),
      pendingFollowups: pendingWithTimers.sort((a, b) =>
        a.hoursUntilNextFollowup - b.hoursUntilNextFollowup
      )
    };
  }
});

/**
 * Send admin message to user (via SMS)
 *
 * NOTE: This is a placeholder. Full implementation requires:
 * 1. Twilio integration
 * 2. Admin authentication/authorization
 * 3. Audit logging
 */
export const sendAdminMessage = mutation({
  args: {
    userId: v.id("users"),
    message: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // TODO: Implement Twilio SMS sending
    // const twilioResult = await sendSMS(user.phoneNumber, args.message);

    // Log conversation
    await ctx.db.insert("conversations", {
      userId: args.userId,
      role: "assistant",
      text: args.message,
      mode: "sms",
      agentName: "admin",
      timestamp: Date.now()
    });

    // Update last contact
    await ctx.db.patch(args.userId, {
      lastContactAt: Date.now()
    });

    return { success: true };
  }
});

/**
 * Reset user's current assessment (clear session state)
 */
export const resetUserAssessment = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Clear assessment state
    await ctx.db.patch(args.userId, {
      assessmentInProgress: false,
      assessmentType: undefined,
      assessmentCurrentQuestion: 0,
      assessmentSessionId: undefined
    });

    return { success: true };
  }
});

/**
 * Get system health metrics for /system dashboard page
 */
export const getSystemHealth = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Re-enable when rate limit table is implemented
    // Rate limits: Query rateLimitState table for current usage
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Placeholder data until rate limit table exists
    const maxUserUsage = 0;
    const globalUsage = 0;

    // Count priority tier users (users with subscriptionStatus === "active")
    const activeSubscriptions = await ctx.db
      .query("users")
      .withIndex("by_subscription", q => q.eq("subscriptionStatus", "active"))
      .collect();

    // OpenAI usage: Query conversations for token usage in last 24h
    const recentConvos = await ctx.db
      .query("conversations")
      .filter(q => q.gte(q.field("timestamp"), oneDayAgo))
      .collect();

    // Estimate tokens (rough approximation: 4 chars = 1 token)
    const totalChars = recentConvos.reduce((sum, c) => sum + (c.text?.length || 0), 0);
    const estimatedTokens = Math.floor(totalChars / 4);

    // Estimate cost (GPT-5 nano pricing: ~$0.50 per 1M tokens input, $1.50 per 1M tokens output)
    // Rough approximation: 60% input, 40% output
    const inputTokens = Math.floor(estimatedTokens * 0.6);
    const outputTokens = Math.floor(estimatedTokens * 0.4);
    const costToday = (inputTokens / 1000000 * 0.50) + (outputTokens / 1000000 * 1.50);

    // Database performance: Calculate average query time from recent conversations
    const conversationsWithLatency = recentConvos.filter(c => c.latency !== undefined);
    const avgLatency = conversationsWithLatency.length > 0
      ? conversationsWithLatency.reduce((sum, c) => sum + (c.latency || 0), 0) / conversationsWithLatency.length
      : 0;

    // P95 latency
    const latencies = conversationsWithLatency
      .map(c => c.latency!)
      .sort((a, b) => a - b);
    const p95Latency = latencies.length > 0
      ? latencies[Math.floor(latencies.length * 0.95)]
      : 0;

    // Error tracking: Count failed conversations (if we stored error flags)
    // For now, return empty array (TODO: implement error logging)
    const errors: Array<{ type: string; count: number; severity: string }> = [];

    return {
      rateLimits: {
        perUser: {
          used: maxUserUsage,
          limit: 60, // Daily per-user SMS limit
          status: maxUserUsage > 50 ? 'warning' : 'ok'
        },
        global: {
          used: globalUsage,
          limit: 5000, // Daily global SMS limit
          status: globalUsage > 4000 ? 'warning' : 'ok'
        },
        priorityUsers: activeSubscriptions.length
      },
      openai: {
        tokensToday: estimatedTokens,
        tokensLimit: 2000000, // 2M token daily budget
        costToday: Math.round(costToday * 100) / 100,
        budget: 10.00 // $10/day budget
      },
      database: {
        queryLatency: Math.round(p95Latency),
        connectionPoolActive: 0, // Convex manages this automatically
        connectionPoolMax: 0,    // Not applicable for Convex
        storageUsed: 0,           // Not easily queryable from Convex
        storageLimit: 10          // Placeholder
      },
      errors
    };
  }
});
