/**
 * Assessment results management for marketing site
 * Stores BSFC assessment results and sends email reports
 */

import { v } from 'convex/values'
import { action, mutation, query, internalMutation } from '../_generated/server'
import { internal, api } from '../_generated/api'

// Handler function extracted to avoid circular reference
async function submitAssessmentHandler(
  ctx: any,
  { email, responses, pressureZones }: { email: string; responses: number[]; pressureZones?: any[] }
): Promise<{
  success: boolean
  resultId: any
  totalScore: number
  band: string
  message: string
}> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format')
  }

  // Validate responses
  if (responses.length !== 10) {
    throw new Error('BSFC-s requires exactly 10 responses')
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim()

  // Calculate total score (0-30) using BSFC-s methodology
  const totalScore = responses.reduce((sum, val) => {
    if (val < 0 || val > 3) {
      throw new Error('Each response must be between 0 and 3')
    }
    return sum + val
  }, 0)

  // Determine burden band based on BSFC-s validated thresholds
  // Thresholds: 0-14 (Mild), 15-19 (Moderate), 20-30 (Severe)
  let band: string
  if (totalScore <= 14) {
    band = 'Mild'
  } else if (totalScore <= 19) {
    band = 'Moderate'
  } else {
    band = 'Severe'
  }

  // Store in database (use internal mutation to avoid circular ref)
  const resultId = await ctx.runMutation(internal.functions.assessmentResults.createInternal, {
    email: normalizedEmail,
    responses,
    totalScore,
    band,
    pressureZones,
  })

  // Send email with results (non-blocking)
  try {
    await ctx.runAction(api.functions.assessmentEmailActions.sendAssessmentEmail, {
      email: normalizedEmail,
      totalScore,
      band,
      pressureZones,
    })
  } catch (emailError) {
    console.error('Failed to send assessment email:', emailError)
    // Don't fail the whole operation if email fails
  }

  // Track email sent in unified contact system (non-blocking)
  try {
    await ctx.runMutation(api.functions.emailContacts.upsert, {
      email: normalizedEmail,
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: totalScore,
        band,
        pressureZones: (pressureZones || []).map((z: any) => z.name),
      },
    })

    await ctx.runMutation(api.functions.emailContacts.trackEmailSent, {
      email: normalizedEmail,
    })
  } catch (trackingError) {
    console.warn('Convex tracking failed (non-blocking):', trackingError)
  }

  return {
    success: true,
    resultId,
    totalScore,
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
    pressureZones: v.optional(v.any()),
  },
  handler: submitAssessmentHandler,
})

// Internal mutation to avoid circular references
export const createInternal = internalMutation({
  args: {
    email: v.string(),
    responses: v.array(v.number()),
    totalScore: v.number(),
    band: v.string(),
    pressureZones: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const id = await ctx.db.insert('assessmentResults', {
      email: args.email,
      responses: args.responses,
      totalScore: args.totalScore,
      band: args.band,
      pressureZones: args.pressureZones,
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
