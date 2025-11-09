"use node";

/**
 * Internal Actions requiring Node.js runtime
 *
 * Contains actions that use Node-specific libraries:
 * - sendWelcomeSms: Uses fetch for Twilio API
 * - newsletterSignup: Uses Resend for email
 * - submit: Uses Resend for assessment results email
 *
 * Separated from internal.ts because mutations/queries cannot be in "use node" files.
 */

import { action, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { Resend } from 'resend';

// ============================================================================
// ONBOARDING - Welcome SMS
// ============================================================================

/**
 * Send welcome SMS via Twilio after successful checkout
 */
export const sendWelcomeSms = internalAction({
  args: {
    phoneNumber: v.string(),
    fullName: v.string(),
  },
  handler: async (ctx, { phoneNumber, fullName }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.error('[onboarding] Twilio credentials not configured');
      return { success: false, error: 'Twilio not configured' };
    }

    // Personalized welcome message
    const firstName = fullName.split(' ')[0];
    const welcomeText = `Hi ${firstName}! Welcome to GiveCare. I'm here to support you 24/7 on your caregiving journey. Text me anytime for guidance, resources, or just someone to listen. How are you doing today?`;

    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: from,
            Body: welcomeText,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[onboarding] Twilio error sending welcome SMS:', error);
        return { success: false, error };
      }

      const data: any = await response.json();
      console.log('[onboarding] Welcome SMS sent:', { sid: data.sid, to: phoneNumber });

      return { success: true, sid: data.sid };
    } catch (error) {
      console.error('[onboarding] Failed to send welcome SMS:', error);
      return { success: false, error: String(error) };
    }
  },
});

// ============================================================================
// NEWSLETTER SIGNUP
// ============================================================================

/**
 * Newsletter signup via Resend
 */
export const newsletterSignup = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    try {
      // Add to Resend audience (newsletter list)
      if (process.env.RESEND_AUDIENCE_ID) {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        });
      }

      // Log subscription in Convex emails table
      await ctx.runMutation(internal.internal.logDelivery, {
        to: email,
        subject: 'Newsletter Subscription',
        status: 'subscribed',
        traceId: `newsletter-${Date.now()}-${email}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Newsletter signup error:', error);
      throw new Error('Failed to subscribe to newsletter');
    }
  },
});

// ============================================================================
// ASSESSMENT RESULTS
// ============================================================================

/**
 * Submit BSFC assessment results from web form
 *
 * This wraps the existing assessments.start/recordAnswer API
 * to match the frontend's BSFC assessment flow
 */
export const submit = action({
  args: {
    email: v.string(),
    responses: v.array(v.number()),
    pressureZones: v.any(),
  },
  handler: async (ctx, { email, responses, pressureZones }): Promise<{ success: boolean; score: number; band: string; pressureZones: any }> => {
    if (responses.length !== 10) {
      throw new Error('BSFC requires exactly 10 responses');
    }

    try {
      // 1. Start assessment session (creates user if needed)
      const startResult: any = await ctx.runMutation(internal.internal.start, {
        userId: email,
        definitionId: 'bsfc_v1',
      });
      const sessionId = startResult.sessionId;

      // 2. Record all 10 answers
      for (let i = 0; i < responses.length; i++) {
        const result: any = await ctx.runMutation(internal.internal.recordAnswer, {
          sessionId,
          definitionId: 'bsfc_v1',
          questionId: `q${i + 1}`,
          value: responses[i],
        });

        // Last answer completes the assessment
        if (result.completed && result.score) {
          const totalScore: number = result.score.total;
          const band: string = result.score.band;

          // 3. Send results email via Resend
          if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
            const resend = new Resend(process.env.RESEND_API_KEY);

            // Determine interpretation
            let interpretation = '';
            if (band === 'low') {
              interpretation =
                "Your burden level is in the mild range. You're managing well, but it's still important to practice self-care and monitor your wellbeing.";
            } else if (band === 'medium') {
              interpretation =
                "Your burden level is moderate. You're experiencing significant stress. Evidence-based interventions can help reduce your burden and improve your quality of life. Consider discussing your caregiving situation with a healthcare professional.";
            } else {
              interpretation =
                "Your burden level is severe, which indicates you may be experiencing significant stress that could impact your health. We strongly encourage you to consult with a healthcare professional, therapist, or counselor who can provide personalized support.";
            }

            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL,
              to: email,
              subject: 'Your Caregiver Burnout Assessment Results',
              html: `
                <h2>Your Assessment Results</h2>
                <p><strong>Total Score:</strong> ${totalScore}/30</p>
                <p><strong>Burden Level:</strong> ${band}</p>
                <p>${interpretation}</p>
                <p>Thank you for using GiveCare.</p>
              `,
            });

            // Log email delivery
            await ctx.runMutation(internal.internal.logDelivery, {
              userId: email,
              to: email,
              subject: 'Your Caregiver Burnout Assessment Results',
              status: 'sent',
              traceId: `assessment-${sessionId}-${Date.now()}`,
            });
          }

          return {
            success: true,
            score: totalScore,
            band,
            pressureZones,
          };
        }
      }

      throw new Error('Assessment did not complete after all answers');
    } catch (error) {
      console.error('Assessment submission error:', error);
      throw error;
    }
  },
});
