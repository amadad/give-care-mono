/**
 * Minimal Internal Agent Functions
 * Only keeps processAssessmentCompletion (still needed by assessments.ts)
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { miraAgent } from "../agents";
import { components, internal } from "../_generated/api";
import { createThread, saveMessage } from "@convex-dev/agent";

/**
 * Process assessment completion
 * Called after assessment scoring to generate interpretation and suggestions
 */
export const processAssessmentCompletion = internalAction({
  args: {
    userId: v.id("users"),
    assessmentId: v.id("assessments"),
    score: v.number(),
    band: v.string(),
  },
  handler: async (ctx, { userId, assessmentId, score, band }) => {
    // Get or create thread
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId,
        paginationOpts: { cursor: null, numItems: 1 },
      }
    );

    let threadId: string;
    if (threads.page.length > 0) {
      threadId = threads.page[0]._id;
    } else {
      threadId = await createThread(ctx, components.agent, {
        userId,
        title: "Assessment Results",
      });
    }

    // Generate interpretation using unified Mira agent
    const prompt = `User completed assessment. Score: ${score} (${band}). Provide encouraging interpretation and suggest 1-2 matched interventions.`;

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      userId,
      prompt,
    });

    const result = await miraAgent.generateText(
      ctx,
      { threadId, userId },
      { promptMessageId: messageId }
    );

    // Send response
    await ctx.runAction(internal.internal.sms.sendAgentResponse, {
      userId,
      text: result.text,
    });
  },
});
