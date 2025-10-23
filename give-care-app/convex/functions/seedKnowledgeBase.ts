/**
 * Seed knowledgeBase with interventions from static data
 *
 * Run with: npx convex run functions/seedKnowledgeBase:seedInterventions
 */

import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Seed knowledgeBase with 5 essential interventions from ZONE_INTERVENTIONS
 */
export const seedInterventions = mutation({
  args: {},
  handler: async ctx => {
    // Check if already seeded
    const existing = await ctx.db.query('knowledgeBase').collect()
    if (existing.length > 0) {
      console.log(`[Seed] knowledgeBase already has ${existing.length} entries. Skipping.`)
      return {
        success: false,
        message: `Already seeded with ${existing.length} entries. Use clearKnowledgeBase first if you want to re-seed.`,
        count: existing.length,
      }
    }

    const now = Date.now()
    const interventions = [
      {
        type: 'intervention',
        category: 'crisis_support',
        title: 'Crisis Text Line',
        description: 'Text HOME to 741741 for 24/7 emotional support',
        content:
          'Free, confidential crisis support via text message. Available 24/7. Trained crisis counselors respond within minutes. No judgment, no medical advice - just someone who cares.',
        pressureZones: ['emotional_wellbeing'],
        tags: ['crisis', 'emotional', 'texting', '24/7', 'free', 'confidential'],
        evidenceSource: 'Crisis Text Line (crisistextline.org)',
        evidenceLevel: 'verified_directory' as const,
        effectivenessPct: 92,
        deliveryFormat: 'sms_text' as const,
        deliveryData: {
          phoneNumber: '741741',
          initialMessage: 'HOME',
          responseTime: '<5 minutes',
        },
        language: 'en',
        culturalTags: [],
        locationSpecific: false,
        zipCodes: [],
        usageCount: 0,
        status: 'active',
        createdBy: 'system_seed',
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'intervention',
        category: 'respite_care',
        title: 'Respite Care Finder',
        description: 'Find temporary care support in your area',
        content:
          'Respite care provides temporary relief for caregivers. Options include in-home care, adult day centers, and short-term residential facilities. Use ARCH National Respite Network to find local providers.',
        pressureZones: ['physical_health', 'time_management'],
        tags: ['respite', 'temporary relief', 'in-home care', 'adult day care', 'breaks'],
        evidenceSource: 'ARCH National Respite Network',
        evidenceLevel: 'verified_directory' as const,
        effectivenessPct: 78,
        deliveryFormat: 'url' as const,
        deliveryData: {
          url: 'https://archrespite.org/respitelocator',
          description: 'Search for respite care providers by zip code',
        },
        language: 'en',
        culturalTags: [],
        locationSpecific: true,
        zipCodes: [],
        usageCount: 0,
        status: 'active',
        createdBy: 'system_seed',
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'intervention',
        category: 'financial_assistance',
        title: 'Financial Assistance Programs',
        description: 'Government and nonprofit support resources',
        content:
          'Financial assistance for caregivers includes: Medicare/Medicaid benefits, National Family Caregiver Support Program (NFCSP), state-specific programs, tax credits, and nonprofit grants. Contact your local Area Agency on Aging (AAA) for eligibility.',
        pressureZones: ['financial_concerns'],
        tags: ['financial', 'medicare', 'medicaid', 'tax credits', 'grants', 'NFCSP'],
        evidenceSource: 'Administration for Community Living (ACL)',
        evidenceLevel: 'verified_directory' as const,
        effectivenessPct: 81,
        deliveryFormat: 'url' as const,
        deliveryData: {
          url: 'https://eldercare.acl.gov',
          phoneNumber: '1-800-677-1116',
          description: 'Eldercare Locator - connects to local Area Agencies on Aging',
        },
        language: 'en',
        culturalTags: [],
        locationSpecific: true,
        zipCodes: [],
        usageCount: 0,
        status: 'active',
        createdBy: 'system_seed',
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'intervention',
        category: 'time_management',
        title: 'Caregiving Task Checklist',
        description: 'Organize and prioritize daily responsibilities',
        content:
          'Use the Caregiver Action Network Daily Task Organizer to: (1) List all caregiving tasks, (2) Prioritize by urgency, (3) Delegate what you can, (4) Schedule breaks, (5) Track medications and appointments. Available as free PDF or app.',
        pressureZones: ['time_management', 'physical_health'],
        tags: ['organization', 'time management', 'checklist', 'scheduling', 'prioritization'],
        evidenceSource: 'Caregiver Action Network',
        evidenceLevel: 'verified_directory' as const,
        effectivenessPct: 79,
        deliveryFormat: 'url' as const,
        deliveryData: {
          url: 'https://caregiveraction.org/resources/caregiver-toolbox',
          description: 'Free caregiving tools and checklists',
        },
        language: 'en',
        culturalTags: [],
        locationSpecific: false,
        zipCodes: [],
        usageCount: 0,
        status: 'active',
        createdBy: 'system_seed',
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'intervention',
        category: 'social_support',
        title: 'Local Caregiver Support Groups',
        description: 'Connect with others who understand',
        content:
          "In-person and virtual support groups provide emotional support, practical tips, and community. Find groups through: Family Caregiver Alliance, AARP, Alzheimer's Association, hospital social workers, and religious organizations. Most are free.",
        pressureZones: ['social_support', 'emotional_wellbeing'],
        tags: ['support groups', 'community', 'peer support', 'virtual', 'in-person', 'free'],
        evidenceSource: 'Family Caregiver Alliance',
        evidenceLevel: 'verified_directory' as const,
        effectivenessPct: 88,
        deliveryFormat: 'url' as const,
        deliveryData: {
          url: 'https://www.caregiver.org/connecting-caregivers/support-groups/',
          phoneNumber: '1-800-445-8106',
          description: 'Search for support groups by location and type',
        },
        language: 'en',
        culturalTags: [],
        locationSpecific: true,
        zipCodes: [],
        usageCount: 0,
        status: 'active',
        createdBy: 'system_seed',
        createdAt: now,
        updatedAt: now,
      },
    ]

    const insertedIds = []

    for (const intervention of interventions) {
      const id = await ctx.db.insert('knowledgeBase', intervention)
      insertedIds.push(id)
      console.log(`[Seed] Inserted: ${intervention.title}`)
    }

    console.log(`[Seed] Successfully seeded ${insertedIds.length} interventions`)

    return {
      success: true,
      message: `Seeded ${insertedIds.length} interventions`,
      count: insertedIds.length,
      insertedIds,
    }
  },
})

/**
 * Clear all knowledgeBase entries (use with caution!)
 *
 * Run with: npx convex run functions/seedKnowledgeBase:clearKnowledgeBase
 */
export const clearKnowledgeBase = mutation({
  args: {},
  handler: async ctx => {
    const entries = await ctx.db.query('knowledgeBase').collect()

    if (entries.length === 0) {
      return {
        success: true,
        message: 'knowledgeBase already empty',
        count: 0,
      }
    }

    let deleted = 0
    for (const entry of entries) {
      await ctx.db.delete(entry._id)
      deleted++
    }

    console.log(`[Seed] Deleted ${deleted} entries from knowledgeBase`)

    return {
      success: true,
      message: `Cleared ${deleted} entries`,
      count: deleted,
    }
  },
})

/**
 * Count knowledgeBase entries
 *
 * Run with: npx convex run functions/seedKnowledgeBase:countKnowledgeBase
 */
export const countKnowledgeBase = mutation({
  args: {},
  handler: async ctx => {
    const entries = await ctx.db.query('knowledgeBase').collect()

    const byType = entries.reduce(
      (acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const withEmbeddings = entries.filter(e => e.embedding !== undefined).length

    return {
      total: entries.length,
      byType,
      withEmbeddings,
      withoutEmbeddings: entries.length - withEmbeddings,
    }
  },
})
