/**
 * Resource Matching Algorithm
 *
 * Matches users to relevant resources based on:
 * 1. Pressure zones (40% weight)
 * 2. Geographic proximity (30% weight)
 * 3. Burnout band fit (15% weight)
 * 4. Quality signals (10% weight)
 * 5. Freshness (5% weight)
 *
 * NO vector embeddings needed - uses structured scoring
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'
import { Doc } from '../_generated/dataModel'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ScoredResource {
  resource: Doc<'resources'>
  program: Doc<'programs'>
  provider: Doc<'providers'>
  facility: Doc<'facilities'> | null
  score: number
  breakdown: {
    zoneScore: number
    geoScore: number
    bandScore: number
    qualityScore: number
    freshnessScore: number
  }
}

// ============================================================================
// MAIN MATCHING QUERY
// ============================================================================

export const matchResourcesForUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }): Promise<ScoredResource[]> => {
    // 1. Get user context
    const [user, profile] = await Promise.all([
      ctx.db.get(userId),
      ctx.db.query('caregiverProfiles').withIndex('by_user', q => q.eq('userId', userId)).first(),
    ])
    if (!user) throw new Error('User not found')

    const latestScore = await ctx.db
      .query('wellnessScores')
      .withIndex('by_user', q => q.eq('userId', userId))
      .order('desc')
      .first()

    const userZones = latestScore?.pressureZones || []
    const userBand = profile?.burnoutBand || 'moderate'
    const userZip = profile?.zipCode || ''
    const userZip3 = userZip.slice(0, 3)

    // 2. Get all active resources
    const allResources = await ctx.db.query('resources').collect()

    // Filter out rejected resources
    const activeResources = allResources.filter(r => r.verificationStatus !== 'rejected')

    // 3. Score each resource
    const scoredResources = await Promise.all(
      activeResources.map(resource =>
        scoreResource(ctx, resource, {
          userZones,
          userBand,
          userZip,
          userZip3,
        })
      )
    )

    // 4. Filter nulls (resources with missing data)
    const validResources = scoredResources.filter((r): r is ScoredResource => r !== null)

    // 5. Sort by score (highest first)
    validResources.sort((a, b) => b.score - a.score)

    // 6. Return top N
    return validResources.slice(0, limit)
  },
})

// ============================================================================
// RESOURCE SCORING FUNCTION
// ============================================================================

async function scoreResource(
  ctx: any,
  resource: Doc<'resources'>,
  userContext: {
    userZones: string[]
    userBand: string
    userZip: string
    userZip3: string
  }
): Promise<ScoredResource | null> {
  // Get related entities
  const program = await ctx.db.get(resource.programId)
  if (!program) return null // Skip if program doesn't exist

  const provider = await ctx.db.get(program.providerId)
  if (!provider) return null

  const facility = resource.facilityId ? await ctx.db.get(resource.facilityId) : null

  const serviceAreas = await ctx.db
    .query('serviceAreas')
    .withIndex('by_program', (q: any) => q.eq('programId', resource.programId))
    .collect()

  // Calculate individual scores
  const zoneScore = calculateZoneScore(program, userContext.userZones)
  const geoScore = calculateGeoScore(serviceAreas, userContext.userZip, userContext.userZip3)
  const bandScore = calculateBandScore(program, userContext.userBand)
  const qualityScore = calculateQualityScore(resource)
  const freshnessScore = calculateFreshnessScore(resource)

  // Weighted combination
  const finalScore =
    zoneScore * 0.4 + geoScore * 0.3 + bandScore * 0.15 + qualityScore * 0.1 + freshnessScore * 0.05

  return {
    resource,
    program,
    provider,
    facility,
    score: finalScore,
    breakdown: {
      zoneScore,
      geoScore,
      bandScore,
      qualityScore,
      freshnessScore,
    },
  }
}

// ============================================================================
// SCORING FACTORS
// ============================================================================

/**
 * Factor 1: Pressure Zone Match (40% weight)
 * Measures overlap between user's pressure zones and resource's supported zones
 */
function calculateZoneScore(program: Doc<'programs'>, userZones: string[]): number {
  if (userZones.length === 0) return 0.5 // Neutral score if no zones

  const overlap = userZones.filter(zone => program.pressureZones.includes(zone)).length

  return overlap / userZones.length // 0.0 to 1.0
}

/**
 * Factor 2: Geographic Proximity (30% weight)
 * Prioritizes local resources over national ones
 */
function calculateGeoScore(
  serviceAreas: Doc<'serviceAreas'>[],
  userZip: string,
  userZip3: string
): number {
  if (!userZip) return 0.7 // Default to national if no ZIP

  if (serviceAreas.length === 0) return 0.7 // Assume national if no service areas

  let bestScore = 0

  for (const area of serviceAreas) {
    let score = 0

    if (area.type === 'national') {
      score = 0.7 // Available everywhere, but not hyper-local
    } else if (area.geoCodes.includes(userZip)) {
      return 1.0 // Perfect match - return immediately
    } else if (area.geoCodes.includes(userZip3)) {
      score = 0.9 // ZIP3 cluster (close by)
    } else if (area.type === 'statewide') {
      // Check if same state (first 2 digits of ZIP)
      const userState = userZip.slice(0, 2)
      const hasMatchingState = area.geoCodes.some(code => code.startsWith(userState))
      if (hasMatchingState) {
        score = 0.6
      }
    }

    bestScore = Math.max(bestScore, score)
  }

  return bestScore
}

/**
 * Factor 3: Burnout Band Fit (15% weight)
 * Some resources work better for specific burnout levels
 */
function calculateBandScore(program: Doc<'programs'>, userBand: string): number {
  const bandBoosts: Record<string, Record<string, number>> = {
    crisis: {
      counseling: 1.0,
      caregiver_support: 0.9,
      respite: 0.5,
      navigation: 0.4,
      education_training: 0.2,
      equipment_devices: 0.3,
      legal_planning: 0.3,
      financial_assistance: 0.5,
    },
    high: {
      respite: 1.0,
      caregiver_support: 0.9,
      counseling: 0.8,
      navigation: 0.7,
      education_training: 0.6,
      financial_assistance: 0.7,
      equipment_devices: 0.6,
      legal_planning: 0.5,
    },
    moderate: {
      caregiver_support: 1.0,
      education_training: 0.9,
      respite: 0.8,
      navigation: 0.7,
      counseling: 0.6,
      financial_assistance: 0.7,
      equipment_devices: 0.6,
      legal_planning: 0.6,
    },
    mild: {
      education_training: 1.0,
      caregiver_support: 0.8,
      navigation: 0.7,
      respite: 0.5,
      financial_assistance: 0.6,
      equipment_devices: 0.5,
      counseling: 0.4,
      legal_planning: 0.6,
    },
    thriving: {
      education_training: 1.0,
      caregiver_support: 0.6,
      navigation: 0.5,
      respite: 0.3,
      counseling: 0.2,
      financial_assistance: 0.4,
      equipment_devices: 0.3,
      legal_planning: 0.4,
    },
  }

  const primaryCategory = program.resourceCategory[0] || 'navigation'
  return bandBoosts[userBand]?.[primaryCategory] || 0.5 // Default neutral
}

/**
 * Factor 4: Quality Signals (10% weight)
 * Based on RBI score, verification status, and feedback volume
 */
function calculateQualityScore(resource: Doc<'resources'>): number {
  // Sub-factor A: RBI score (70%)
  const rbiScore =
    resource.scoreRbi !== undefined && resource.scoreRbi !== null ? resource.scoreRbi : 0.5 // Neutral if no feedback

  // Sub-factor B: Verification status (20%)
  const verificationBoosts: Record<string, number> = {
    verified_full: 1.0,
    verified_basic: 0.7,
    unverified: 0.3,
  }
  const verificationBoost = verificationBoosts[resource.verificationStatus] || 0.3

  // Sub-factor C: Sample size confidence (10%)
  const totalFeedback = (resource.successCount || 0) + (resource.issueCount || 0)
  const confidenceBoost = Math.min(totalFeedback / 50, 1.0) // Cap at 50

  return rbiScore * 0.7 + verificationBoost * 0.2 + confidenceBoost * 0.1
}

/**
 * Factor 5: Freshness (5% weight)
 * Resources decay in quality over time
 */
function calculateFreshnessScore(resource: Doc<'resources'>): number {
  if (!resource.lastVerifiedDate) {
    // Assume 1 year old if never verified
    return 0.0
  }

  const daysSinceVerification = (Date.now() - resource.lastVerifiedDate) / (24 * 60 * 60 * 1000)

  // Linear decay over 1 year
  return Math.max(0, 1 - daysSinceVerification / 365)
}

// ============================================================================
// UTILITY QUERY: Get Resource Details
// ============================================================================

export const getResourceDetails = query({
  args: {
    resourceId: v.id('resources'),
  },
  handler: async (ctx, { resourceId }) => {
    const resource = await ctx.db.get(resourceId)
    if (!resource) return null

    const program = await ctx.db.get(resource.programId)
    const provider = program ? await ctx.db.get(program.providerId) : null
    const facility = resource.facilityId ? await ctx.db.get(resource.facilityId) : null

    const serviceAreas = program
      ? await ctx.db
          .query('serviceAreas')
          .withIndex('by_program', q => q.eq('programId', resource.programId))
          .collect()
      : []

    const feedback = await ctx.db
      .query('resourceFeedback')
      .withIndex('by_resource', q => q.eq('resourceId', resourceId))
      .collect()

    return {
      resource,
      program,
      provider,
      facility,
      serviceAreas,
      feedback,
      stats: {
        totalFeedback: feedback.length,
        successRate:
          feedback.length > 0
            ? feedback.filter(f => f.type === 'success').length / feedback.length
            : null,
      },
    }
  },
})
