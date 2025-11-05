"use node";

import { action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { Resend } from 'resend';
import OpenAI from 'openai';
import { buildEmailContext } from '../src/email/context';
import { getOrchestratorInstructions, getComposerInstructions } from '../src/email/instructions';

// Lazy-load API clients to avoid initialization errors during deployment
function _getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

/**
 * Generate and send personalized email using LLM agents
 */
export const generateAndSendEmail = action({
  args: {
    email: v.string(),
    trigger: v.object({
      type: v.union(v.literal('weekly_summary'), v.literal('assessment_followup'), v.literal('campaign')),
      day: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { email, trigger }) => {
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
        model: process.env.OPENAI_MODEL || 'gpt-5-nano',
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

      const _composerResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-5-nano',
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

      // 5. Render to HTML
      // Temporary workaround: disable LLM email system until we set up proper rendering service
      throw new Error('LLM email rendering temporarily disabled - needs Node.js service');
    } catch (error) {
      console.error('Email generation error:', error);
      throw error;
    }
  },
});

/**
 * Batch send emails (with rate limiting)
 */
export const sendBatchEmails = action({
  args: {
    contacts: v.array(v.string()), // Array of email addresses
    trigger: v.object({
      type: v.union(v.literal('weekly_summary'), v.literal('assessment_followup'), v.literal('campaign')),
      day: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { contacts, trigger }) => {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const email of contacts) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email,
          trigger,
        });
        results.success++;

        // Rate limiting: 10 emails per second max
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        results.errors.push(`${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  },
});
