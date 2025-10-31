"use node";

import { internalAction } from '../_generated/server';
import { internal, api } from '../_generated/api';

/**
 * Day 3 assessment follow-up
 */
export const sendDay3Followup = internalAction({
  args: {},
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    const oneDayWindow = 2 * 60 * 60 * 1000; // 2 hour window

    // Get contacts eligible for Day 3 follow-up
    const allContacts = await ctx.runQuery(
      api.functions.emailContacts.getAssessmentFollowupSubscribers
    );

    const eligible = allContacts.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(Date.now() - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 2.5 && daysSince <= 3.5; // 2.5-3.5 days
    });

    console.log(`Day 3 follow-up: ${eligible.length} eligible contacts`);

    // Send to each
    for (const contact of eligible) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email: contact.email,
          trigger: { type: 'assessment_followup', day: 3 },
        });
      } catch (error) {
        console.error(`Failed to send Day 3 follow-up to ${contact.email}:`, error);
      }
    }

    return { sent: eligible.length };
  },
});

/**
 * Day 7 assessment follow-up
 */
export const sendDay7Followup = internalAction({
  args: {},
  handler: async (ctx) => {
    const allContacts = await ctx.runQuery(
      api.functions.emailContacts.getAssessmentFollowupSubscribers
    );

    const eligible = allContacts.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(Date.now() - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 6.5 && daysSince <= 7.5;
    });

    console.log(`Day 7 follow-up: ${eligible.length} eligible contacts`);

    for (const contact of eligible) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email: contact.email,
          trigger: { type: 'assessment_followup', day: 7 },
        });
      } catch (error) {
        console.error(`Failed to send Day 7 follow-up to ${contact.email}:`, error);
      }
    }

    return { sent: eligible.length };
  },
});

/**
 * Day 14 assessment follow-up
 */
export const sendDay14Followup = internalAction({
  args: {},
  handler: async (ctx) => {
    const allContacts = await ctx.runQuery(
      api.functions.emailContacts.getAssessmentFollowupSubscribers
    );

    const eligible = allContacts.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(Date.now() - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 13.5 && daysSince <= 14.5;
    });

    console.log(`Day 14 follow-up: ${eligible.length} eligible contacts`);

    for (const contact of eligible) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email: contact.email,
          trigger: { type: 'assessment_followup', day: 14 },
        });
      } catch (error) {
        console.error(`Failed to send Day 14 follow-up to ${contact.email}:`, error);
      }
    }

    return { sent: eligible.length };
  },
});
