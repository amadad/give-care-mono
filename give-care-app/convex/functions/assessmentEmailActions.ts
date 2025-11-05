/**
 * Assessment email sending actions (Node.js runtime for Resend)
 */

"use node";

import { action } from '../_generated/server'
import { v } from 'convex/values'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import AssessmentResults from '../email/templates/AssessmentResults'
import * as React from 'react'

// Helper to get interpretation text
function getInterpretation(band: string): string {
  const interpretations: Record<string, string> = {
    Mild: "Your burden level is in the mild range. You're managing well, but it's still important to practice self-care and monitor your wellbeing.",
    Moderate: "Your burden level is moderate. You're experiencing significant stress. Evidence-based interventions can help reduce your burden and improve your quality of life.",
    Severe: "Your burden level is severe. You're at high risk for burnout and health complications. Immediate support is crucial. We're here to help you find relief.",
  }
  return interpretations[band] || ''
}

/**
 * Send assessment results email
 */
export const sendAssessmentEmail = action({
  args: {
    email: v.string(),
    totalScore: v.number(),
    band: v.string(),
    pressureZones: v.optional(v.any()),
  },
  handler: async (ctx, { email, totalScore, band, pressureZones }) => {
    // Validate required environment variables
    if (!process.env.RESEND_API_KEY) {
      const error = 'RESEND_API_KEY not configured in Convex environment. Run: npx convex env set RESEND_API_KEY <key>'
      console.error('❌ Email configuration error:', error)
      throw new Error(error)
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const interpretation = getInterpretation(band)

      // Render React Email template
      const emailHtml = await render(
        React.createElement(AssessmentResults, {
          email,
          score: totalScore,
          band: band as 'Mild' | 'Moderate' | 'Severe',
          interpretation,
          pressureZones: pressureZones || [],
        })
      )

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'GiveCare <hello@my.givecareapp.com>',
        to: [email],
        subject: `Your BSFC Assessment Results: ${band} Burden (${totalScore}/30)`,
        html: emailHtml,
      })

      console.log(`✅ Assessment results email sent to: ${email} (${band} - ${totalScore}/30)`)
      return { success: true }
    } catch (emailError) {
      console.error('Failed to send assessment email:', emailError)
      throw emailError
    }
  },
})
