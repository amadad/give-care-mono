"use node";

import { action } from './_generated/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Resend } from 'resend';
import OpenAI from 'openai';
import { buildEmailContext } from '../src/email/context';
import { getOrchestratorInstructions, getComposerInstructions } from '../src/email/instructions';

// Lazy-load API clients
function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

/**
 * Test email generation without Next.js rendering
 * Uses simple HTML template instead
 */
export const testGenerateAndSendEmail = action({
  args: {
    email: v.string(),
    trigger: v.object({
      type: v.union(v.literal('weekly_summary'), v.literal('assessment_followup'), v.literal('campaign')),
      day: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { email, trigger }): Promise<any> => {
    try {
      // 1. Load subscriber context
      const contact = await ctx.runQuery(api.functions.emailContacts.getByEmail, { email });

      if (!contact) {
        throw new Error(`Contact not found: ${email}`);
      }

      const emailContext = buildEmailContext(contact, trigger);

      // 2. Orchestrator: Select content strategy
      const orchestratorPrompt = getOrchestratorInstructions(emailContext);
      const openai = getOpenAI();

      const orchestratorResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: orchestratorPrompt,
          },
          {
            role: 'user',
            content: `Generate content plan for this email. Available tools: searchEmailContent. Return JSON only.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const contentPlan = JSON.parse(orchestratorResponse.choices[0].message.content || '{}');

      // 3. Search for content blocks based on plan
      const contentBlocks = [];
      for (const block of contentPlan.contentBlocks || []) {
        const results = await ctx.runQuery(api.functions.emailContent.searchEmailContent, {
          blockType: block.blockType,
          tone: block.tone,
          pressureZones: block.pressureZones,
          limit: 1,
        });
        if (results.length > 0) {
          contentBlocks.push(results[0]);
        }
      }

      // 4. Composer: Map to components
      const composerPrompt = getComposerInstructions(contentPlan, contentBlocks, emailContext);

      const composerResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: composerPrompt,
          },
          {
            role: 'user',
            content: `Map content blocks to React Email components. Return JSON component tree only.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const componentTree = JSON.parse(composerResponse.choices[0].message.content || '{}');

      // 5. Generate simple HTML (skip Next.js rendering for test)
      const subject = contentPlan.subject || 'Your Caregiver Assessment Follow-up';
      const html = generateSimpleHtml(subject, componentTree, emailContext);

      // 6. Send via Resend
      const resend = getResend();
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'GiveCare <hello@my.givecareapp.com>',
        to: [email],
        subject,
        html,
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      // 7. Track in Convex
      await ctx.runMutation(api.functions.emailContacts.trackEmailSent, { email });

      console.log(`✅ Test email sent to: ${email} (${trigger.type})`);

      return {
        success: true,
        messageId: data?.id,
        subject,
        contentPlan,
        contentBlocks: contentBlocks.length,
        components: componentTree.components?.length || 0,
      };
    } catch (error) {
      console.error('Email generation error:', error);
      throw error;
    }
  },
});

/**
 * Generate simple HTML email template
 */
function generateSimpleHtml(
  subject: string,
  componentTree: any,
  context: any
): string {
  const components = componentTree.components || [];

  const componentHtml = components.map((comp: any) => {
    switch (comp.type) {
      case 'ValidationBlock':
        return `
          <div style="background: #fef3c7; padding: 24px; margin: 16px 0; border-radius: 8px;">
            <p style="font-size: 18px; color: #78350f; margin: 0;">${comp.props.message}</p>
          </div>
        `;
      case 'ScoreCard':
        return `
          <div style="background: white; padding: 24px; margin: 16px 0; border-radius: 8px; text-align: center;">
            <p style="font-size: 48px; font-weight: bold; color: #54340E; margin: 0;">${comp.props.score}<span style="font-size: 24px; color: #92400e;">/30</span></p>
            <p style="font-size: 18px; color: #ef4444; margin: 8px 0;">${comp.props.band} Burden</p>
          </div>
        `;
      case 'InterventionCard':
        return `
          <div style="background: white; padding: 24px; margin: 16px 0; border-radius: 8px;">
            <h3 style="font-size: 20px; color: #54340E; margin: 0 0 12px 0;">${comp.props.title}</h3>
            <p style="font-size: 16px; color: #78350f; line-height: 1.6; margin: 0 0 16px 0;">${comp.props.description}</p>
            <a href="${comp.props.ctaHref}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">${comp.props.ctaText}</a>
          </div>
        `;
      case 'CTAButton':
        return `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${comp.props.href}" style="display: inline-block; background: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: 600;">${comp.props.text}</a>
          </div>
        `;
      default:
        return '';
    }
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Georgia, serif; background: #FFE8D6; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <!-- Header -->
        <div style="padding: 32px 0 24px 0;">
          <img src="https://www.givecareapp.com/gc-logo.png" alt="GiveCare" width="180" height="27" style="display: block;" />
        </div>

        <!-- Content -->
        ${componentHtml}

        <!-- Footer -->
        <hr style="border: none; border-top: 1px solid #f5e6d3; margin: 32px 0 24px 0;" />
        <div style="text-align: center; padding: 24px 0;">
          <p style="font-size: 14px; color: #92400e; margin: 8px 0;">GiveCare • Evidence-based caregiver support</p>
          <p style="font-size: 14px; color: #92400e; margin: 8px 0;">
            <a href="https://givecareapp.com/unsubscribe" style="color: #78350f; text-decoration: none;">Unsubscribe</a> •
            <a href="https://givecareapp.com/privacy" style="color: #78350f; text-decoration: none;">Privacy</a>
          </p>
          <p style="font-size: 12px; color: #c4915a; margin: 12px 0 0 0;">Based on research from Erlangen University Hospital</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
