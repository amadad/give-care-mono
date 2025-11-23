/**
 * Internal Workflow Actions
 * Run check-ins and engagement monitoring
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getUserMetadata } from "../lib/utils";

/**
 * Run EMA check-ins for eligible users
 * Called by daily cron
 */
export const runCheckIns = internalAction({
  args: {},
  handler: async (ctx) => {
    // Feature flag check
    const emaEnabled = process.env.FF_EMA === "true";
    if (!emaEnabled) {
      return { message: "EMA check-ins disabled via feature flag" };
    }

    // Get users who need check-ins
    const eligibleUsers = await ctx.runQuery(
      internal.internal.users.getUsersWithCheckIns,
      {}
    );

    let count = 0;
    for (const user of eligibleUsers) {
      // Start check-in workflow for each user
      await ctx.runAction(internal.workflows.startCheckInWorkflow, {
        userId: user._id,
      });
      count++;
    }

    return { message: `Started ${count} check-in workflows` };
  },
});

/**
 * Check engagement and send nudges
 * Called by daily cron
 * Optimized: Single query for all inactive users, batch suppression checks
 */
export const checkEngagement = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all inactive users in a single query (14 days covers all buckets)
    // Filter by days in code to avoid multiple sequential queries
    const allInactiveUsers = await ctx.runQuery(internal.internal.users.getInactiveUsers, {
      days: 14, // Get all users inactive for 14+ days (covers day5, day7, day14)
    });

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Batch fetch all user data and guardrail events in parallel
    // This avoids sequential queries inside the loop
    const userIds = allInactiveUsers.map((u) => u._id);
    
    // Batch fetch users and crisis events
    const [usersData, crisisEventsData] = await Promise.all([
      // Fetch all users in parallel
      Promise.all(
        userIds.map((userId) =>
          ctx.runQuery(internal.internal.users.getUser, { userId })
        )
      ),
      // Fetch crisis events for all users in parallel
      Promise.all(
        userIds.map((userId) =>
          ctx.runQuery(internal.internal.users.getRecentGuardrailEvents, {
            userId,
            since: sevenDaysAgo,
            type: "crisis",
          })
        )
      ),
    ]);

    // Create lookup maps for O(1) access
    const usersMap = new Map(
      usersData.map((user, i) => [userIds[i], user])
    );
    const crisisMap = new Map(
      crisisEventsData.map((events, i) => [userIds[i], events])
    );

    // Categorize users by inactivity level and check suppression
    const day5Users: Array<{ _id: any; level: "day5" }> = [];
    const day7Users: Array<{ _id: any; level: "day7" }> = [];
    const day14Users: Array<{ _id: any; level: "day14" }> = [];

    for (const user of allInactiveUsers) {
      const fullUser = usersMap.get(user._id);
      if (!fullUser) continue;

      const metadata = getUserMetadata(fullUser);
      const lastEngagementDate = fullUser.lastEngagementDate || 0;
      const daysSinceEngagement = (now - lastEngagementDate) / (24 * 60 * 60 * 1000);

      // Check suppression conditions (using batched data)
      const recentCrises = crisisMap.get(user._id) || [];
      if (recentCrises.length > 0) {
        continue; // Suppress - has crisis in last 7d
      }

      const hasReassuranceLoop = metadata.reassuranceLoopFlag === true;
      if (hasReassuranceLoop) {
        continue; // Suppress - in reassurance loop
      }

      const snoozeUntil = metadata.snoozeUntil;
      if (snoozeUntil && now < snoozeUntil) {
        continue; // Suppress - snoozed
      }

      // Categorize by inactivity level
      if (daysSinceEngagement >= 14) {
        day14Users.push({ _id: user._id, level: "day14" });
      } else if (daysSinceEngagement >= 7) {
        day7Users.push({ _id: user._id, level: "day7" });
      } else if (daysSinceEngagement >= 5) {
        day5Users.push({ _id: user._id, level: "day5" });
      }
    }

    // Send nudges (prioritize day14, then day7, then day5)
    // Process in parallel batches
    const sendNudges = async (
      users: Array<{ _id: any; level: "day5" | "day7" | "day14" }>
    ) => {
      await Promise.all(
        users.map((user) =>
          ctx.runAction(internal.internal.sms.sendEngagementNudge, {
            userId: user._id,
            level: user.level,
          })
        )
      );
      return users.length;
    };

    const [day14Count, day7Count, day5Count] = await Promise.all([
      sendNudges(day14Users),
      sendNudges(day7Users),
      sendNudges(day5Users),
    ]);

    return {
      message: `Sent ${day5Count} day5, ${day7Count} day7, ${day14Count} day14 nudges`,
    };
  },
});
