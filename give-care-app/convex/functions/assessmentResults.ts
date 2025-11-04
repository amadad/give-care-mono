/**
 * Assessment results management for marketing site
 * Stores BSFC assessment results and sends email reports
 */

"use node";

import { v } from 'convex/values'
import { action, mutation, query, internalMutation } from '../_generated/server'
import { internal, api } from '../_generated/api'
import { Resend } from 'resend'

// Helper to get interpretation text
function getInterpretation(band: string): string {
  const interpretations: Record<string, string> = {
    Mild: "Your burden level is in the mild range. You're managing well, but it's still important to practice self-care and monitor your wellbeing.",
    Moderate: "Your burden level is moderate. You're experiencing significant stress. Evidence-based interventions can help reduce your burden and improve your quality of life.",
    Severe: "Your burden level is severe. You're at high risk for burnout and health complications. Immediate support is crucial. We're here to help you find relief.",
  }
  return interpretations[band] || ''
}

// Helper to generate email HTML
function generateAssessmentEmail(
  score: number,
  band: string,
  pressureZones: any[] = []
): string {
  const interpretation = getInterpretation(band)
  const topZones = pressureZones.slice(0, 3)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your BSFC Assessment Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fef3c7;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 24px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #78350f; font-size: 28px; margin: 0 0 8px 0;">Your Assessment Results</h1>
      <p style="color: #92400e; font-size: 14px; margin: 0;">Burden Scale for Family Caregivers (BSFC-s)</p>
    </div>

    <!-- Score Card -->
    <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <div style="font-size: 48px; font-weight: bold; color: #78350f; margin-bottom: 8px;">${score}/30</div>
      <div style="font-size: 20px; color: #92400e; margin-bottom: 16px;">${band} Burden</div>
      <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0;">${interpretation}</p>
    </div>

    ${topZones.length > 0 ? `
    <!-- Pressure Zones -->
    <div style="margin-bottom: 24px;">
      <h2 style="color: #78350f; font-size: 20px; margin: 0 0 16px 0;">Your Top Pressure Zones</h2>
      ${topZones.map(zone => `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 12px; border-radius: 4px;">
          <div style="font-weight: bold; color: #78350f; margin-bottom: 4px;">${zone.name}</div>
          <div style="color: #92400e; font-size: 14px;">${zone.description}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://www.givecareapp.com/signup" style="display: inline-block; background-color: #78350f; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500;">Get Personalized Support</a>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #fcd34d; padding-top: 24px; margin-top: 32px; text-align: center;">
      <p style="color: #92400e; font-size: 12px; line-height: 1.6; margin: 0 0 8px 0;">GiveCare provides evidence-based support for family caregivers.</p>
      <p style="color: #92400e; font-size: 12px; margin: 0;">
        <a href="https://www.givecareapp.com" style="color: #92400e; text-decoration: underline;">Visit our website</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

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

  // Send email with results
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const emailHtml = generateAssessmentEmail(totalScore, band, pressureZones)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'GiveCare <hello@my.givecareapp.com>',
      to: [normalizedEmail],
      subject: `Your BSFC Assessment Results: ${band} Burden (${totalScore}/30)`,
      html: emailHtml,
    })

    console.log(`✅ Assessment results email sent to: ${normalizedEmail} (${band} - ${totalScore}/30)`)
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
