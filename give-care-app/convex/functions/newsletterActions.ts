/**
 * Newsletter signup actions (Node.js runtime for Resend)
 */

"use node";

import { action } from '../_generated/server'
import { v } from 'convex/values'
import { api } from '../_generated/api'
import { Resend } from 'resend'
import { rateLimiter, RATE_LIMITS, RATE_LIMIT_MESSAGES } from '../rateLimits.config'

/**
 * Newsletter signup action (replaces /api/newsletter route)
 * Includes rate limiting and Resend sync
 */
export const newsletterSignup = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }): Promise<{
    success: boolean
    message: string
    isNew: boolean
  }> => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit by email
    const { ok } = await rateLimiter.limit(ctx, 'newsletter', {
      key: normalizedEmail,
      config: RATE_LIMITS.newsletterSignup as any,
    })

    if (!ok) {
      throw new Error(RATE_LIMIT_MESSAGES.newsletterSignup)
    }

    // Upsert to unified contact system
    const result = await ctx.runMutation(api.functions.emailContacts.upsert, {
      email: normalizedEmail,
      tags: ['newsletter'],
      preferences: {
        newsletter: true,
        assessmentFollowup: false,
        productUpdates: true,
      },
    })

    // Optionally sync to Resend audience (if configured)
    if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.contacts.create({
          email: normalizedEmail,
          audienceId: process.env.RESEND_AUDIENCE_ID as string,
        })
        console.log(`✅ Synced newsletter subscriber to Resend: ${normalizedEmail}`)
      } catch (_err) {
        // Ignore if already exists in Resend
        console.log('Resend sync skipped (may already exist):', normalizedEmail)
      }
    } else {
      console.warn('⚠️ Resend sync disabled: RESEND_API_KEY or RESEND_AUDIENCE_ID not configured')
      console.warn('Newsletter subscriber saved to Convex only:', normalizedEmail)
    }

    return {
      success: true,
      message: 'Successfully subscribed to newsletter',
      isNew: result.isNew,
    }
  },
})
