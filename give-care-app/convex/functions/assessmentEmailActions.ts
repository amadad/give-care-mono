/**
 * Assessment email sending actions (Node.js runtime for Resend)
 */

"use node";

import { action } from '../_generated/server'
import { v } from 'convex/values'
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
      const emailHtml = generateAssessmentEmail(totalScore, band, pressureZones)

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
