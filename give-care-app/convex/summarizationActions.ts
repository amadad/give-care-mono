"use node";

/**
 * Conversation Summarization Actions (Task 9)
 *
 * Node.js actions for summarization using OpenAI.
 * Separated from summarization.ts because "use node" files cannot contain queries/mutations.
 */

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import OpenAI from 'openai';

const SUMMARY_VERSION = process.env.SUMMARY_VERSION || 'baseline-v1';
const INPUT_COST_PER_MILLION = 0.15; // gpt-4o-mini input pricing ($/1M tokens)
const OUTPUT_COST_PER_MILLION = 0.6; // gpt-4o-mini output pricing ($/1M tokens)

type SummaryUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  recordedAt: number;
};

type SummaryResult = {
  summary: string;
  usage?: SummaryUsage;
};

/**
 * Generate summary of historical messages using OpenAI
 * Focuses on caregiver challenges and progress
 */
async function summarizeMessages(
  openai: OpenAI,
  messages: Array<{ role: string; content: string; timestamp: number }>,
  options: { focus: string; maxTokens: number }
): Promise<SummaryResult> {
  if (messages.length === 0) {
    return { summary: '' };
  }

  // Format messages for summarization
  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are summarizing a caregiver's conversation history to preserve context. Focus on:
- Caregiver challenges (stress, exhaustion, financial issues, isolation)
- Progress made (support groups joined, respite care started, interventions tried)
- What strategies worked and what didn't
- Care recipient's condition and needs

Keep the summary concise but preserve critical details about the caregiver's journey.
Maximum length: ${options.maxTokens} tokens.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cost-efficient model
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: conversationText },
    ],
    max_tokens: options.maxTokens,
    temperature: 0.3, // Lower temperature for consistent summaries
  });

  const content = response.choices[0].message.content || '';
  const usage = response.usage;

  if (!usage) {
    return { summary: content };
  }

  const promptTokens = usage.prompt_tokens ?? usage.promptTokens ?? 0;
  const completionTokens = usage.completion_tokens ?? usage.completionTokens ?? 0;
  const totalTokens = usage.total_tokens ?? usage.totalTokens ?? promptTokens + completionTokens;
  const costUsd =
    (promptTokens / 1_000_000) * INPUT_COST_PER_MILLION +
    (completionTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return {
    summary: content,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd: Number(costUsd.toFixed(6)),
      recordedAt: Date.now(),
    },
  };
}

/**
 * Update caregiver profile with summarized conversation history
 */
export const updateCaregiverProfile = internalAction({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Split messages by recency
    const { recentMessages, historicalMessages } = await ctx.runMutation(
      internal.summarization.splitMessagesByRecency,
      { userId: args.userId }
    );

    let historicalSummary = '';
    let summarizationTriggered = false;
    let summaryUsage: SummaryUsage | undefined;

    // Only summarize if historical messages > 20
    if (historicalMessages.length > 20) {
      summarizationTriggered = true;

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const result = await summarizeMessages(openai, historicalMessages, {
        focus: 'caregiver_challenges_and_progress',
        maxTokens: 500,
      });
      historicalSummary = result.summary;
      summaryUsage = result.usage;
    }

    // Get first message timestamp for conversationStartDate
    const allMessages = [...historicalMessages, ...recentMessages];
    const conversationStartDate =
      allMessages.length > 0 ? allMessages[0].timestamp : Date.now();

    // Update users table
    await ctx.runMutation(internal.summarization.patchUserSummary, {
      userId: args.userId,
      recentMessages,
      historicalSummary,
      conversationStartDate,
      totalInteractionCount: allMessages.length,
      ...(summarizationTriggered
        ? {
            historicalSummaryVersion: SUMMARY_VERSION,
            ...(summaryUsage ? { historicalSummaryTokenUsage: summaryUsage } : {}),
          }
        : {}),
    });

    return {
      recentMessages,
      historicalMessages,
      historicalSummary,
      summarizationTriggered,
      summaryUsage,
      summaryVersion: summarizationTriggered ? SUMMARY_VERSION : undefined,
    };
  },
});

/**
 * Scheduled cron job: Process all active users with >30 messages
 */
export const summarizeAllUsers = internalAction({
  handler: async (ctx) => {
    // Get active users (not churned)
    const users = await ctx.runQuery(internal.summarization.getActiveUsers, {});

    let processedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Count messages for this user
      const messageCount = await ctx.runQuery(internal.summarization.countUserMessages, {
        userId: user._id,
      });

      // Only process if >30 messages
      if (messageCount > 30) {
        await ctx.runAction(internal.summarizationActions.updateCaregiverProfile, {
          userId: user._id,
        });
        processedCount++;
      } else {
        skippedCount++;
      }
    }

    return {
      processedCount,
      skippedCount,
      totalUsers: users.length,
    };
  },
});
