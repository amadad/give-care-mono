'use node'

/**
 * OpenAI Batch API Integration for Conversation Summarization
 *
 * Cost savings: 50% discount on batch processing (24-hour turnaround)
 * Pricing: gpt-5-nano batch = $0.025/1M input, $0.20/1M output
 * vs sync: $0.05/1M input, $0.40/1M output
 *
 * Flow:
 * 1. Weekly cron (Sunday 3am PT) creates batch job
 * 2. Generate JSONL file with all summarization requests
 * 3. Upload file to OpenAI and create batch
 * 4. Hourly cron checks batch status
 * 5. When completed, download results and apply summaries
 */

import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import OpenAI from 'openai'
import type { Id } from './_generated/dataModel'

const SUMMARY_VERSION = process.env.SUMMARY_VERSION || 'batch-v1'
const INPUT_COST_PER_MILLION = 0.025 // gpt-5-nano batch input pricing (50% discount)
const OUTPUT_COST_PER_MILLION = 0.2 // gpt-5-nano batch output pricing (50% discount)

type UserSummaryJob = {
  userId: Id<'users'>
  historicalMessages: Array<{ role: string; content: string; timestamp: number }>
  recentMessages: Array<{ role: string; content: string; timestamp: number }>
}

/**
 * Create weekly batch summarization job
 * Runs Sunday 3am PT (11:00 UTC)
 */
export const createWeeklySummarizationBatch: any = internalAction({
  handler: async (ctx): Promise<any> => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Get active users with >30 messages
    const users: any = await ctx.runQuery(internal.summarization.getActiveUsers, {})

    const userJobs: UserSummaryJob[] = []

    for (const user of users) {
      const messageCount = await ctx.runQuery(internal.summarization.countUserMessages, {
        userId: user._id,
      })

      if (messageCount > 30) {
        const { recentMessages, historicalMessages }: any = await ctx.runMutation(
          internal.summarization.splitMessagesByRecency,
          { userId: user._id }
        )

        if (historicalMessages.length > 20) {
          userJobs.push({
            userId: user._id,
            historicalMessages,
            recentMessages,
          })
        }
      }
    }

    if (userJobs.length === 0) {
      return { message: 'No users need summarization', userCount: 0 }
    }

    // Generate JSONL file content
    const jsonlLines = userJobs.map((job, index) => {
      const conversationText = job.historicalMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n')

      const systemPrompt = `You are summarizing a caregiver's conversation history to preserve context. Focus on:
- Caregiver challenges (stress, exhaustion, financial issues, isolation)
- Progress made (support groups joined, respite care started, interventions tried)
- What strategies worked and what didn't
- Care recipient's condition and needs

Keep the summary concise but preserve critical details about the caregiver's journey.
Maximum length: 500 tokens.`

      return JSON.stringify({
        custom_id: `user_${job.userId}_${index}`,
        method: 'POST',
        url: '/v1/chat/completions',
        body: {
          model: 'gpt-5-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: conversationText },
          ],
          max_tokens: 500,
          temperature: 0.3,
        },
      })
    })

    const jsonlContent = jsonlLines.join('\n')

    // Upload JSONL file to OpenAI
    const file = await openai.files.create({
      file: new File([jsonlContent], 'batch-input.jsonl', { type: 'application/jsonl' }),
      purpose: 'batch',
    })

    // Create batch job
    const batch = await openai.batches.create({
      input_file_id: file.id,
      endpoint: '/v1/chat/completions',
      completion_window: '24h',
    })

    // Store batch job in database
    await ctx.runMutation(internal.batchJobs.storeBatchJob, {
      batchId: batch.id,
      status: batch.status,
      endpoint: batch.endpoint,
      inputFileId: file.id,
      requestCounts: {
        total: batch.request_counts?.total || 0,
        completed: batch.request_counts?.completed || 0,
        failed: batch.request_counts?.failed || 0,
      },
      userIds: userJobs.map(job => job.userId),
      createdAt: Date.now(),
      expiresAt: batch.expires_at ? batch.expires_at * 1000 : undefined,
    })

    return {
      batchId: batch.id,
      userCount: userJobs.length,
      status: batch.status,
      inputFileId: file.id,
    }
  },
})

/**
 * Check batch status and process completed batches
 * Runs every hour
 */
export const processBatchJobs: any = internalAction({
  handler: async (ctx): Promise<any> => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Get all in-progress batches
    const pendingBatches: any = await ctx.runQuery(internal.batchJobs.getPendingBatches, {})

    let processedCount = 0
    let stillPendingCount = 0

    for (const batchJob of pendingBatches) {
      // Check batch status from OpenAI
      const batch = await openai.batches.retrieve(batchJob.batchId)

      // Update status in database
      await ctx.runMutation(internal.batchJobs.updateBatchStatus, {
        batchId: batchJob.batchId,
        status: batch.status,
        requestCounts: {
          total: batch.request_counts.total,
          completed: batch.request_counts.completed,
          failed: batch.request_counts.failed,
        },
        outputFileId: batch.output_file_id || undefined,
        errorFileId: batch.error_file_id || undefined,
        completedAt: batch.completed_at ? batch.completed_at * 1000 : undefined,
      })

      if (batch.status === 'completed' && batch.output_file_id) {
        // Download and process results
        await ctx.runAction(internal.batchSummarization.processCompletedBatch, {
          batchId: batchJob.batchId,
          outputFileId: batch.output_file_id,
        })
        processedCount++
      } else {
        stillPendingCount++
      }
    }

    return { processedCount, stillPendingCount }
  },
})

/**
 * Process completed batch results
 */
export const processCompletedBatch: any = internalAction({
  args: {
    batchId: v.string(),
    outputFileId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Download output file
    const fileContent = await openai.files.content(args.outputFileId)
    const fileText = await fileContent.text()

    // Parse JSONL results
    const results = fileText
      .trim()
      .split('\n')
      .map(line => JSON.parse(line))

    let appliedCount = 0

    for (const result of results) {
      if (result.response.status_code !== 200) {
        console.error(`Failed summarization for ${result.custom_id}:`, result.error)
        continue
      }

      // Extract userId from custom_id (format: "user_{userId}_{index}")
      const userId = result.custom_id.split('_')[1] as Id<'users'>

      const summary = result.response.body.choices[0].message.content
      const usage = result.response.body.usage

      const promptTokens = usage.prompt_tokens ?? 0
      const completionTokens = usage.completion_tokens ?? 0
      const totalTokens = usage.total_tokens ?? promptTokens + completionTokens
      const costUsd =
        (promptTokens / 1_000_000) * INPUT_COST_PER_MILLION +
        (completionTokens / 1_000_000) * OUTPUT_COST_PER_MILLION

      // Get messages for this user
      const { recentMessages }: any = await ctx.runMutation(
        internal.summarization.splitMessagesByRecency,
        { userId }
      )

      // Get all messages for conversationStartDate
      const allMessages: any = await ctx.runQuery(internal.summarization.getUserMessages, {
        userId,
      })
      const conversationStartDate = allMessages.length > 0 ? allMessages[0].timestamp : Date.now()

      // Update user with summary
      await ctx.runMutation(internal.summarization.patchUserSummary, {
        userId,
        recentMessages,
        historicalSummary: summary,
        conversationStartDate,
        totalInteractionCount: allMessages.length,
        historicalSummaryVersion: SUMMARY_VERSION,
        historicalSummaryTokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens,
          costUsd: Number(costUsd.toFixed(6)),
          recordedAt: Date.now(),
        },
      })

      appliedCount++
    }

    return { appliedCount, totalResults: results.length }
  },
})
