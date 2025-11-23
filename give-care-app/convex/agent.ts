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
import {
  getCrisisResources,
  startAssessmentTool,
  recordAssessmentAnswerTool,
} from "./tools";

/**
 * Build assessment status context for agent
 * Injects current assessment status into system message
 */
function buildAssessmentContext(
  hasSDOH: boolean,
  hasEMA: boolean,
  currentScore: number | null,
  lastSDOH: { completedAt: number } | null
): string {
  if (hasSDOH && currentScore !== null && lastSDOH) {
    const dateStr = new Date(lastSDOH.completedAt).toLocaleDateString();
    return `\n\nAssessment Status: User has SDOH assessment. Last score: ${currentScore} (${dateStr}).`;
  } else if (hasEMA && !hasSDOH) {
    return `\n\nAssessment Status: User has EMA check-ins but no full SDOH assessment yet.`;
  } else {
    return `\n\nAssessment Status: User has not completed any assessments yet.`;
  }
}

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
    // Parallel: Get thread + assessment status
    const [threads, user, lastSDOH, lastEMA] = await Promise.all([
      ctx.runQuery(components.agent.threads.listThreadsByUserId, {
        userId,
        paginationOpts: { cursor: null, numItems: 1 },
      }),
      ctx.runQuery(internal.internal.users.getUser, { userId }),
      ctx.runQuery(internal.internal.assessments.getLatestCompletedAssessment, {
        userId,
        assessmentType: "sdoh",
      }),
      ctx.runQuery(internal.internal.assessments.getLatestCompletedAssessment, {
        userId,
        assessmentType: "ema",
      }),
    ]);

    let threadId: string;
    if (threads.page.length > 0) {
      threadId = threads.page[0]._id;
    } else {
      threadId = await createThread(ctx, components.agent, {
        userId,
        title: "Care Conversation",
      });
    }

    // Build assessment status context
    const currentScore = user?.gcSdohScore ?? null;
    const hasSDOH = lastSDOH !== null;
    const hasEMA = lastEMA !== null;
    const assessmentContext = buildAssessmentContext(hasSDOH, hasEMA, currentScore, lastSDOH);

    // Detect message patterns for conditional tool loading
    const messageLower = message.toLowerCase().trim();
    const isSimpleAcknowledgment =
      messageLower.length < 15 &&
      /^(ok|okay|thanks|thank you|got it|yes|no|sure|nope|yep|k|kk|cool|alright|great|perfect|good)$/i.test(
        messageLower
      );
    const isGreeting =
      messageLower.length < 20 &&
      /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(
        messageLower
      );
    const isNumericAnswer = /^[0-5]$/i.test(messageLower); // Assessment answer (1-5)
    const isAssessmentControl =
      /^(skip|cancel|stop assessment)$/i.test(messageLower);

    // Conditional tool loading based on message type
    let tools:
      | Record<string, any>
      | undefined = undefined;

    if (isSimpleAcknowledgment || isGreeting) {
      // Simple messages: only crisis detection needed
      tools = { getCrisisResources };
    } else if (isNumericAnswer || isAssessmentControl) {
      // Assessment flow: assessment tools + crisis
      tools = {
        getCrisisResources,
        startAssessmentTool,
        recordAssessmentAnswerTool,
      };
    }
    // else: undefined = use agent default (all 7 tools)

    // Generate response through Mira with injected context and conditional tools
    const result = await miraAgent.generateText(
      ctx,
      { threadId, userId },
      {
        prompt: message,
        system: assessmentContext,
        tools, // Dynamically override tools based on message pattern
      },
      {
        // Optimize context for SMS: reduce tokens, faster responses
        contextOptions: {
          excludeToolMessages: true, // SMS is conversational, not technical
          recentMessages: 30, // Reduce from default 100 for efficiency
          searchOptions: {
            limit: 5, // Reduce from default 10 for token efficiency
            vectorSearch: true, // Use vector search for memory recall
            textSearch: false, // Vector is better for semantic matching
            messageRange: { before: 1, after: 0 }, // Minimal context padding
          },
        },
      }
    );

    // Validate response before sending
    if (!result.text || result.text.trim().length === 0) {
      console.error("Agent returned empty response", {
        userId,
        message,
        resultKeys: Object.keys(result),
      });

      // Send fallback message instead of failing silently
      await ctx.runAction(internal.internal.sms.sendAgentResponse, {
        userId,
        text: "I'm here to help. Could you tell me more about what you need?",
      });

      return { success: false, error: "empty_response", response: "" };
    }

    // Send response via SMS
    await ctx.runAction(internal.internal.sms.sendAgentResponse, {
      userId,
      text: result.text,
    });

    return { success: true, response: result.text };
  },
});
