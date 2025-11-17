/**
 * Feedback and Analytics Queries
 * Public queries for admin dashboard to review conversation quality and crisis feedback
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get conversation quality metrics
 * Combines session metrics with feedback data
 */
export const getConversationQualityMetrics = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    // Get conversation feedback
    const feedback = userId
      ? await ctx.db
          .query("conversation_feedback")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("conversation_feedback")
          .order("desc")
          .take(limit);

    // Calculate metrics
    const total = feedback.length;
    const helpful = feedback.filter((f) => f.helpful).length;
    const unhelpful = total - helpful;
    const helpfulnessRate = total > 0 ? (helpful / total) * 100 : 0;

    // Group by reason
    const reasonCounts: Record<string, number> = {};
    feedback.forEach((f) => {
      if (f.reason) {
        reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
      }
    });

    return {
      total,
      helpful,
      unhelpful,
      helpfulnessRate,
      reasonCounts,
      recentFeedback: feedback,
    };
  },
});

/**
 * Get crisis feedback summary
 * Shows crisis intervention effectiveness
 */
export const getCrisisFeedbackSummary = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 50 }) => {
    const feedback = await ctx.db
      .query("crisis_feedback")
      .order("desc")
      .take(limit);

    const total = feedback.length;
    const connected = feedback.filter((f) => f.connectedWith988 === true).length;
    const notConnected = feedback.filter((f) => f.connectedWith988 === false).length;
    const helpful = feedback.filter((f) => f.wasHelpful === true).length;
    const notHelpful = feedback.filter((f) => f.wasHelpful === false).length;

    const connectionRate = total > 0 ? (connected / total) * 100 : 0;
    const helpfulnessRate = total > 0 ? (helpful / total) * 100 : 0;

    return {
      total,
      connected,
      notConnected,
      connectionRate,
      helpful,
      notHelpful,
      helpfulnessRate,
      recentFeedback: feedback,
    };
  },
});

/**
 * Get crisis alerts with feedback for review
 * Shows crisis events alongside user feedback
 */
export const getCrisisAlertsWithFeedback = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 20 }) => {
    const alerts = await ctx.db
      .query("alerts")
      .filter((q) => q.eq(q.field("type"), "crisis"))
      .order("desc")
      .take(limit);

    // Fetch feedback for each alert
    const alertsWithFeedback = await Promise.all(
      alerts.map(async (alert) => {
        const feedback = await ctx.db
          .query("crisis_feedback")
          .withIndex("by_alert", (q) => q.eq("alertId", alert._id))
          .first();

        const user = await ctx.db.get(alert.userId);

        return {
          alert,
          feedback,
          user: user
            ? {
                _id: user._id,
                phone: (user as any).phone,
                name: (user as any).name,
              }
            : null,
        };
      })
    );

    return alertsWithFeedback;
  },
});

/**
 * Get session outcome metrics
 * Tracks conversation success indicators
 */
export const getSessionOutcomeMetrics = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const sessions = userId
      ? await ctx.db
          .query("session_metrics")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("session_metrics")
          .order("desc")
          .take(limit);

    // Calculate aggregate metrics
    const total = sessions.length;
    const withAssessment = sessions.filter((s) => s.assessmentCompleted).length;
    const withCrisis = sessions.filter((s) => s.crisisDetected).length;
    const withReturn = sessions.filter((s) => s.userReturnedNext24h).length;

    const assessmentRate = total > 0 ? (withAssessment / total) * 100 : 0;
    const crisisRate = total > 0 ? (withCrisis / total) * 100 : 0;
    const returnRate = total > 0 ? (withReturn / total) * 100 : 0;

    // Calculate average response time
    const sessionsWithTime = sessions.filter((s) => s.avgResponseTimeMs);
    const avgResponseTime =
      sessionsWithTime.length > 0
        ? sessionsWithTime.reduce((sum, s) => sum + (s.avgResponseTimeMs || 0), 0) /
          sessionsWithTime.length
        : 0;

    return {
      total,
      withAssessment,
      withCrisis,
      withReturn,
      assessmentRate,
      crisisRate,
      returnRate,
      avgResponseTime,
      recentSessions: sessions,
    };
  },
});

/**
 * Get guardrail events for review
 * Shows all safety-related events with context
 */
export const getGuardrailEventsForReview = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("crisis"),
        v.literal("false_positive"),
        v.literal("dv_hint"),
        v.literal("crisis_followup_sent"),
        v.literal("stress_spike_followup_sent"),
        v.literal("reassurance_loop"),
        v.literal("self_sacrifice")
      )
    ),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { type, severity, limit = 50 }) => {
    // Build query based on available filters
    let events;

    if (severity) {
      // Use severity index if provided
      const query = ctx.db
        .query("guardrail_events")
        .withIndex("by_severity", (q) => q.eq("severity", severity));

      events = type
        ? await query.filter((q) => q.eq(q.field("type"), type)).order("desc").take(limit)
        : await query.order("desc").take(limit);
    } else {
      // No index, just filter by type if provided
      const query = ctx.db.query("guardrail_events");

      events = type
        ? await query.filter((q) => q.eq(q.field("type"), type)).order("desc").take(limit)
        : await query.order("desc").take(limit);
    }

    // Fetch user info for each event
    const eventsWithUsers = await Promise.all(
      events.map(async (event) => {
        const user = event.userId ? await ctx.db.get(event.userId) : null;

        return {
          event,
          user: user
            ? {
                _id: user._id,
                phone: (user as any).phone,
                name: (user as any).name,
                riskLevel: (user as any).riskLevel,
              }
            : null,
        };
      })
    );

    return eventsWithUsers;
  },
});
