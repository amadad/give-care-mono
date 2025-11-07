import { action } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';
import { Resend } from 'resend';

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
      const startResult: any = await ctx.runMutation(api.functions.assessments.start, {
        userId: email,
        definitionId: 'bsfc_v1',
      });
      const sessionId = startResult.sessionId;

      // 2. Record all 10 answers
      for (let i = 0; i < responses.length; i++) {
        const result: any = await ctx.runMutation(api.functions.assessments.recordAnswer, {
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
            await ctx.runMutation(api.functions.email.logDelivery, {
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
