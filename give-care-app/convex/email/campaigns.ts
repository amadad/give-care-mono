"use node";

import { internalAction } from '../_generated/server';
import { api } from '../_generated/api';

/**
 * Weekly wellness summary
 */
export const sendWeeklySummary = internalAction({
  args: {},
  handler: async (ctx) => {
    const subscribers = await ctx.runQuery(
      api.functions.emailContacts.getNewsletterSubscribers
    );

    console.log(`Weekly summary: ${subscribers.length} subscribers`);

    for (const contact of subscribers) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email: contact.email,
          trigger: { type: 'weekly_summary' },
        });

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send weekly summary to ${contact.email}:`, error);
      }
    }

    return { sent: subscribers.length };
  },
});
