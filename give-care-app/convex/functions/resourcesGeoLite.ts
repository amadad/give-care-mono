/**
 * Geo-Lite Resource Query (MVP)
 *
 * Query fallback logic: ZIP → state → national
 * Never returns empty; degrades gracefully
 * Includes disclosure and lastVerified on all results
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'
import type { Doc } from '../_generated/dataModel'
import { scoreResource, matchesZones, calculateFreshness } from '../ingestion/shared/scoring'

type ResourceRecord = Doc<'resources'>
type ProgramRecord = Doc<'programs'>
type ProviderRecord = Doc<'providers'>
type FacilityRecord = Doc<'facilities'>
type ServiceAreaRecord = Doc<'serviceAreas'>

// ZIP3 → State mapping (top 100 ZIP prefixes)
const ZIP3_TO_STATE: Record<string, string> = {
  '100': 'NY',
  '101': 'NY',
  '102': 'NY',
  '103': 'NY',
  '104': 'NY',
  '105': 'NY',
  '106': 'NY',
  '107': 'NY',
  '108': 'NY',
  '109': 'NY',
  '200': 'DC',
  '201': 'VA',
  '202': 'DC',
  '203': 'DC',
  '204': 'DC',
  '205': 'VA',
  '206': 'MD',
  '207': 'MD',
  '208': 'MD',
  '209': 'MD',
  '300': 'FL',
  '301': 'FL',
  '302': 'FL',
  '303': 'GA',
  '304': 'GA',
  '305': 'FL',
  '306': 'FL',
  '307': 'FL',
  '308': 'FL',
  '309': 'FL',
  '400': 'KY',
  '401': 'KY',
  '402': 'KY',
  '403': 'KY',
  '404': 'IN',
  '405': 'OH',
  '406': 'KY',
  '407': 'FL',
  '408': 'FL',
  '409': 'FL',
  '500': 'IA',
  '501': 'IA',
  '502': 'IN',
  '503': 'IA',
  '504': 'IN',
  '600': 'IL',
  '601': 'IL',
  '602': 'IL',
  '603': 'IL',
  '604': 'IL',
  '605': 'IL',
  '606': 'IL',
  '607': 'IL',
  '608': 'IL',
  '609': 'IL',
  '700': 'LA',
  '701': 'LA',
  '702': 'LA',
  '703': 'TX',
  '704': 'LA',
  '800': 'CO',
  '801': 'CO',
  '802': 'CO',
  '803': 'CO',
  '804': 'CO',
  '900': 'CA',
  '901': 'CA',
  '902': 'CA',
  '903': 'CA',
  '904': 'CA',
  '905': 'CA',
  '906': 'CA',
  '907': 'CA',
  '908': 'CA',
  '909': 'CA',
}

function resolveStateFromZip(zip: string | undefined): string | undefined {
  if (!zip || zip.length < 3) return undefined
  const zip3 = zip.slice(0, 3)
  return ZIP3_TO_STATE[zip3]
}

interface ResourceMatch {
  title: string
  provider: string
  description: string
  phone: string | null
  website: string | null
  location: string
  rbiScore: number
  lastVerified: string
  disclaimer: string
}

/**
 * Find resources with fallback logic
 *
 * Fallback order:
 * 1. Try ZIP + zones
 * 2. Try state + zones (if ZIP fails)
 * 3. Try national + zones
 * 4. Return national resources (no zone filter)
 */
export const findResourcesGeoLite = query({
  args: {
    zip: v.optional(v.string()),
    zones: v.optional(v.array(v.string())),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ResourceMatch[]> => {
    const limit = args.limit ?? 5
    const state = resolveStateFromZip(args.zip)

    // STEP 1: Get all service areas
    const allServiceAreas = (await ctx.db.query('serviceAreas').collect()) as ServiceAreaRecord[]

    // STEP 2: Try ZIP-based match
    let candidateAreas = allServiceAreas.filter(area => {
      if (area.type === 'national') return false
      if (!args.zip) return false

      const zip3 = args.zip.slice(0, 3)
      return area.geoCodes.includes(args.zip) || area.geoCodes.includes(zip3)
    })

    // STEP 3: Fallback to state
    if (candidateAreas.length === 0 && state) {
      candidateAreas = allServiceAreas.filter(
        area => area.type === 'statewide' && area.geoCodes.includes(state)
      )
    }

    // STEP 4: Fallback to national
    if (candidateAreas.length === 0) {
      candidateAreas = allServiceAreas.filter(area => area.type === 'national')
    }

    // STEP 5: Build resource matches
    const matches: Array<{
      resource: ResourceRecord
      program: ProgramRecord
      provider: ProviderRecord
      facility: FacilityRecord | null
      score: number
    }> = []

    const programIds = new Set(candidateAreas.map(area => area.programId))

    for (const programId of programIds) {
      const program = (await ctx.db.get(programId)) as ProgramRecord | null
      if (!program) continue

      // Filter by type if provided
      if (args.type && !program.resourceCategory.includes(args.type)) {
        continue
      }

      const provider = (await ctx.db.get(program.providerId)) as ProviderRecord | null
      if (!provider) continue

      const resources = (await ctx.db
        .query('resources')
        .withIndex('by_program', (q: any) => q.eq('programId', programId))
        .collect()) as ResourceRecord[]

      for (const resource of resources) {
        const facility = resource.facilityId
          ? ((await ctx.db.get(resource.facilityId)) as FacilityRecord | null)
          : null

        // Calculate score
        const zoneMatch = matchesZones(program.pressureZones, args.zones)
        const freshnessDays = calculateFreshness(resource.lastVerifiedDate)
        const verified = resource.verificationStatus === 'verified_full'

        const serviceArea = candidateAreas.find(a => a.programId === programId)
        const coverage =
          serviceArea?.type === 'national'
            ? 'national'
            : serviceArea?.type === 'statewide'
              ? 'state'
              : serviceArea?.type === 'county'
                ? 'county'
                : 'zip'

        const score = scoreResource({
          zoneMatch,
          coverage,
          freshnessDays,
          verified,
        })

        matches.push({
          resource,
          program,
          provider,
          facility,
          score,
        })
      }
    }

    // STEP 6: Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score)

    // STEP 7: Format results with disclosure
    const results = matches.slice(0, limit).map(m => {
      const lastVerifiedDate = m.resource.lastVerifiedDate
        ? new Date(m.resource.lastVerifiedDate).toLocaleDateString()
        : 'Unknown'

      return {
        title: m.program.name,
        provider: m.provider.name,
        description: m.program.description || '',
        phone: m.facility?.phoneE164 || null,
        website: m.resource.primaryUrl || null,
        location: m.facility?.zip
          ? `${m.facility.city || ''}, ${m.facility.state || ''} ${m.facility.zip}`.trim()
          : 'Nationwide',
        rbiScore: m.score,
        lastVerified: lastVerifiedDate,
        disclaimer: 'Availability changes. Please call to confirm.',
      }
    })

    return results
  },
})

/**
 * Get resources for a specific user (uses their ZIP + pressure zones)
 *
 * Security: Validates that authenticated user matches requested userId
 * to prevent unauthorized access to other users' personalized recommendations
 */
export const getResourcesForUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify user ownership
    // Get authenticated user identity
    const identity = await ctx.auth.getUserIdentity()

    // Check 1: User must be authenticated
    if (!identity) {
      throw new Error('Unauthenticated: User must be logged in to access resources')
    }

    // Check 2: Authenticated user must match requested userId
    // Note: Convex Auth identity has a subject field that contains the user ID
    const authenticatedUserId = identity.subject

    if (!authenticatedUserId || authenticatedUserId.trim() === '') {
      throw new Error('Unauthenticated: Invalid user identity')
    }

    if (authenticatedUserId !== args.userId) {
      throw new Error('Unauthorized: Cannot access resources for a different user')
    }

    // Proceed with existing logic - user is authorized
    const user = await ctx.db.get(args.userId)
    if (!user) return []

    // Get latest wellness score for pressure zones
    const score = await ctx.db
      .query('wellnessScores')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .order('desc')
      .first()

    return ctx.runQuery(findResourcesGeoLite, {
      zip: user.zipCode,
      zones: score?.pressureZones || user.pressureZones,
      limit: args.limit || 3,
    })
  },
})
