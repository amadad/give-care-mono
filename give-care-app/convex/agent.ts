/**
 * Unified Agent Message Handler
 * Single entry point for all user messages
 * Agent handles crisis, assessments, conversation, everything
 */

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { miraAgent } from "./agents";
import { components, internal } from "./_generated/api";
import { createThread } from "@convex-dev/agent";

/**
 * Process message through Mira (unified agent)
 * Handles all conversation, assessments, crisis, resources
 */
export const chat = internalAction({
  args: {
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, { userId, message }) => {
    // Get or create thread for user
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
        title: "Care Conversation",
      });
    }

    // Generate response through Mira
    const result = await miraAgent.generateText(
      ctx,
      { threadId, userId },
      {
        prompt: message,
      }
    );

    // Send response via SMS
    await ctx.runAction(internal.internal.sms.sendAgentResponse, {
      userId,
      text: result.text,
    });

    return { success: true, response: result.text };
  },
});
