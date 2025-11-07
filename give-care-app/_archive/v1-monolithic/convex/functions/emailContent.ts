/**
 * Email content management for LLM-composable email system
 * Seeds and queries knowledgeBase for email-specific content
 */

import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Seed validation messages for emails
 */
export const seedValidationMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const messages = [
      {
        type: 'validation',
        category: 'emotional_validation',
        title: 'Your Burden is Real',
        description: 'Clinical validation of caregiver burden',
        content: 'What you\'re feeling is real—and now it\'s measured. This clinically validated assessment gives you language for what you\'re experiencing. Caregiving is hard. You\'re not alone in this, and you deserve support.',
        pressureZones: ['emotional_wellbeing'],
        tags: ['validation', 'assessment_results', 'p1_compliant'],
        evidenceLevel: 'clinical_trial',
        deliveryFormat: 'email',
        deliveryData: {},
        language: 'en',
        culturalTags: ['universal'],
        locationSpecific: false,
        zipCodes: [],
        usageCount: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        emailBlockType: 'validation',
        tone: 'compassionate',
        length: 'medium',
        componentHint: 'ValidationBlock',
      },
      {
        type: 'validation',
        category: 'physical_validation',
        title: 'Physical Exhaustion is Valid',
        description: 'Validation for physical burden',
        content: 'The physical toll of caregiving is measurable and real. Sleep deprivation, chronic fatigue, and health decline aren\'t signs of weakness—they\'re natural responses to sustained caregiving stress.',
        pressureZones: ['physical_health'],
        tags: ['validation', 'physical_exhaustion', 'p1_compliant'],
        evidenceLevel: 'peer_reviewed',
        deliveryFormat: 'email',
        deliveryData: {},
        language: 'en',
        culturalTags: ['universal'],
        locationSpecific: false,
        zipCodes: [],
        usageCount: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        emailBlockType: 'validation',
        tone: 'compassionate',
        length: 'short',
        componentHint: 'ValidationBlock',
      },
      {
        type: 'validation',
        category: 'financial_validation',
        title: 'Financial Strain is Common',
        description: 'Validation for financial concerns',
        content: 'Over 60% of family caregivers report financial strain. Lost income, medical bills, and care costs add up. This burden is documented, measurable, and deserves attention.',
        pressureZones: ['financial_concerns'],
        tags: ['validation', 'financial_strain', 'p1_compliant'],
        evidenceLevel: 'clinical_trial',
        deliveryFormat: 'email',
        deliveryData: {},
        language: 'en',
        culturalTags: ['universal'],
        locationSpecific: false,
        zipCodes: [],
        usageCount: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        emailBlockType: 'validation',
        tone: 'compassionate',
        length: 'short',
        componentHint: 'ValidationBlock',
      },
    ];

    const ids = [];
    for (const msg of messages) {
      const id = await ctx.db.insert('knowledgeBase', msg);
      ids.push(id);
    }

    return { inserted: ids.length, ids };
  },
});

/**
 * Search email content by type, tone, and pressure zones
 */
export const searchEmailContent = query({
  args: {
    blockType: v.optional(v.string()), // validation | tip | intervention | resource
    tone: v.optional(v.string()), // compassionate | encouraging | urgent | neutral
    pressureZones: v.optional(v.array(v.string())),
    band: v.optional(v.string()), // Mild | Moderate | Severe
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query('knowledgeBase').withIndex('by_status', (q) => q.eq('status', 'active'));

    const results = await query.collect();

    // Filter by email-specific criteria
    let filtered = results.filter((item) => item.deliveryFormat === 'email');

    if (args.blockType) {
      filtered = filtered.filter((item) => item.emailBlockType === args.blockType);
    }

    if (args.tone) {
      filtered = filtered.filter((item) => item.tone === args.tone);
    }

    if (args.pressureZones && args.pressureZones.length > 0) {
      filtered = filtered.filter((item) =>
        args.pressureZones!.some((zone) => item.pressureZones.includes(zone))
      );
    }

    // Sort by usage and effectiveness
    filtered.sort((a, b) => {
      const aScore = (a.effectivenessPct || 0) - (a.usageCount * 0.1);
      const bScore = (b.effectivenessPct || 0) - (b.usageCount * 0.1);
      return bScore - aScore;
    });

    return filtered.slice(0, args.limit || 10);
  },
});

/**
 * Get content by ID
 */
export const getContentById = query({
  args: {
    id: v.id('knowledgeBase'),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});
