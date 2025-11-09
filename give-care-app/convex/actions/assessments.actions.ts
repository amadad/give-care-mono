"use node";

/**
 * Assessment submission action that emails BSFC results via Resend.
 */

import { action } from '../_generated/server';
import { api } from '../_generated/api';
import { v } from 'convex/values';
import { Resend } from 'resend';

export const submit = action({
  args: {
    email: v.string(),
    responses: v.array(v.number()),
    pressureZones: v.any(),
  },
  handler: async (ctx, { email, responses, pressureZones }) => {
    if (responses.length !== 10) {
      throw new Error('BSFC requires exactly 10 responses');
    }

    const startResult: any = await ctx.runMutation(api.domains.assessments.start, {
      userId: email,
      definitionId: 'bsfc_v1',
    });
    const sessionId = startResult.sessionId;

    for (let i = 0; i < responses.length; i++) {
      const result: any = await ctx.runMutation(api.domains.assessments.recordAnswer, {
        sessionId,
        definitionId: 'bsfc_v1',
        questionId: `q${i + 1}`,
        value: responses[i],
      });

      if (result.completed && result.score) {
        const totalScore: number = result.score.total;
        const band: string = result.score.band;

        if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
          const resend = new Resend(process.env.RESEND_API_KEY);
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

          await ctx.runMutation(api.domains.email.logDelivery, {
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
  },
});
