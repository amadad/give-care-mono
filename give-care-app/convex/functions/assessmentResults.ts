/**
 * Assessment results management for marketing site
 * Stores BSFC assessment results and sends email reports
 */

import { v } from 'convex/values'
import { action, mutation, query, internalMutation } from '../_generated/server'
import { internal } from '../_generated/api'

// Handler function extracted to avoid circular reference
async function submitAssessmentHandler(
  ctx: any,
  { email, responses }: { email: string; responses: number[] }
): Promise<{
  success: boolean
  resultId: any
  totalScore: number
  averageScore: number
  band: string
  message: string
}> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format')
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim()

  // Calculate score (sum of responses)
  const totalScore = responses.reduce((sum, val) => sum + val, 0)
  const averageScore = totalScore / responses.length

  // Determine burnout band based on BSFC scoring
  // BSFC uses 1-5 scale, where higher = more burnout
  let band: string
  if (averageScore >= 4) {
    band = 'high'
  } else if (averageScore >= 3) {
    band = 'moderate'
  } else if (averageScore >= 2) {
    band = 'mild'
  } else {
    band = 'thriving'
  }

  // Store in database (use internal mutation to avoid circular ref)
  const resultId = await ctx.runMutation(internal.functions.assessmentResults.createInternal, {
    email: normalizedEmail,
    responses,
    totalScore,
    averageScore,
    band,
  })

  return {
    success: true,
    resultId,
    totalScore,
    averageScore,
    band,
    message: 'Assessment submitted successfully',
  }
}

/**
 * Submit assessment results from marketing site
 * Public action - called from assessment flow
 */
export const submit = action({
  args: {
    email: v.string(),
    responses: v.array(v.number()),
  },
  handler: submitAssessmentHandler,
})

// Internal mutation to avoid circular references
export const createInternal = internalMutation({
  args: {
    email: v.string(),
    responses: v.array(v.number()),
    totalScore: v.number(),
    averageScore: v.number(),
    band: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const id = await ctx.db.insert('assessmentResults', {
      email: args.email,
      responses: args.responses,
      totalScore: args.totalScore,
      averageScore: args.averageScore,
      band: args.band,
      submittedAt: now,
    })

    return id
  },
})

/**
 * Get assessment results by email (for thank you page)
 */
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const results = await ctx.db
      .query('assessmentResults')
      .withIndex('by_email', (q: any) => q.eq('email', email.toLowerCase().trim()))
      .order('desc')
      .first()

    return results
  },
})

/**
 * List all assessment results (admin only)
 */
export const listAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const results = await ctx.db
      .query('assessmentResults')
      .order('desc')
      .take(limit || 100)

    return results
  },
})
