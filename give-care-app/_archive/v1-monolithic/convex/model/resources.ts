import type { FilterBuilder, NamedTableInfo } from 'convex/server'
import type { DataModel, Doc, Id } from '../_generated/dataModel'

type ServiceAreaRecord = Doc<'serviceAreas'>
type ProgramRecord = Doc<'programs'>
type ProviderRecord = Doc<'providers'>
type FacilityRecord = Doc<'facilities'>
type ResourceRecord = Doc<'resources'>

const MS_PER_DAY = 24 * 60 * 60 * 1000

const VERIFICATION_WEIGHTS: Record<string, number> = {
  unverified: 0.2,
  verified_basic: 0.6,
  verified_full: 1,
}

const DEFAULT_ZONE_MATCH = 0.7

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function serviceAreaMatchesZip(area: ServiceAreaRecord, zip: string) {
  if (!zip) return false
  const trimmedZip = zip.trim()
  if (trimmedZip.length < 3) return false
  const zip3 = trimmedZip.slice(0, 3)
  const zip2 = trimmedZip.slice(0, 2)
  if (area.type === 'national') return true
  if (!Array.isArray(area.geoCodes) || area.geoCodes.length === 0) return false
  if (area.geoCodes.includes(trimmedZip)) return true
  if (area.type === 'zip_cluster' && area.geoCodes.includes(zip3)) return true
  if (area.type === 'statewide' && area.geoCodes.includes(zip2)) return true
  return false
}

function estimateZoneMatch(programZones: string[], queryZones?: string[]) {
  if (!queryZones || queryZones.length === 0) return DEFAULT_ZONE_MATCH
  if (!programZones || programZones.length === 0) return 0
  const programSet = new Set(programZones)
  const matches = queryZones.filter(zone => programSet.has(zone))
  return matches.length / queryZones.length
}

function calculateFreshnessScore(lastVerified?: number | null) {
  if (!lastVerified) return 0.4
  const days = (Date.now() - lastVerified) / MS_PER_DAY
  if (days <= 30) return 1
  if (days >= 365) return 0
  return clamp(1 - (days - 30) / (365 - 30), 0, 1)
}

function calculateVerificationScore(status: string) {
  return VERIFICATION_WEIGHTS[status] ?? 0.2
}

function computeOutcomeSignal(successCount?: number | null, issueCount?: number | null) {
  const successes = successCount ?? 0
  const issues = issueCount ?? 0
  const total = successes + issues
  if (total === 0) return 0.5
  return successes / total
}

function scoreJurisdictionFit(areaType?: string, jurisdictionLevel?: string | null) {
  if (!areaType && !jurisdictionLevel) return 0.7
  if (areaType === 'national' || jurisdictionLevel === 'national') return 1
  if (areaType === 'statewide' && (jurisdictionLevel === 'state' || jurisdictionLevel === 'federal')) return 0.9
  if (areaType === 'county' && (jurisdictionLevel === 'county' || jurisdictionLevel === 'state')) return 0.85
  if (areaType === 'zip_cluster') return 0.75
  return 0.7
}

function calculatePenalty(brokenLink?: boolean | null, bounceCount?: number | null) {
  const linkPenalty = brokenLink ? 0.2 : 0
  const bouncePenalty = Math.min(0.2, (bounceCount ?? 0) * 0.02)
  return linkPenalty + bouncePenalty
}

function calculateRbi({
  zoneMatch,
  verificationStatus,
  lastVerifiedDate,
  jurisdictionFit,
  outcomeSignal,
  brokenLink,
  bounceCount,
}: {
  zoneMatch: number
  verificationStatus: string
  lastVerifiedDate?: number | null
  jurisdictionFit: number
  outcomeSignal: number
  brokenLink?: boolean | null
  bounceCount?: number | null
}) {
  const verificationScore = calculateVerificationScore(verificationStatus)
  const freshnessScore = calculateFreshnessScore(lastVerifiedDate)
  const penalties = calculatePenalty(brokenLink, bounceCount)
  const weighted = 0.3 * zoneMatch + 0.25 * verificationScore + 0.2 * freshnessScore + 0.15 * jurisdictionFit + 0.1 * outcomeSignal - penalties
  return clamp(Math.round(Math.max(0, Math.min(1, weighted)) * 100))
}

function ensureDefaultCounts(resource: ResourceRecord) {
  return {
    success: resource.successCount ?? 0,
    issue: resource.issueCount ?? 0,
  }
}

function deduplicateServiceAreas(areas: ServiceAreaRecord[]) {
  const seen = new Set<string>()
  return areas.filter(area => {
    const key = `${area.programId}:${area.type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function findResourcesInternal(
  ctx: any,
  args: { zip: string; zones?: string[]; bands?: string[]; limit?: number }
) {
  const limit = args.limit ?? 5
  const MAX_SERVICE_AREAS = 200
  const allServiceAreas = (await ctx.db.query('serviceAreas').take(MAX_SERVICE_AREAS)) as ServiceAreaRecord[]
  const matchingAreas = allServiceAreas.filter(area => serviceAreaMatchesZip(area, args.zip))
  const fallbackAreas: ServiceAreaRecord[] = matchingAreas.length > 0 ? matchingAreas : allServiceAreas.filter(area => area.type === 'national')
  const candidateAreas = deduplicateServiceAreas(fallbackAreas)
  const candidateProgramIds = new Set<Id<'programs'>>(candidateAreas.map(area => area.programId))

  const candidateProgramIdsArray = Array.from(candidateProgramIds)
  const allPrograms =
    candidateProgramIdsArray.length === 0
      ? []
      : await ctx.db
          .query('programs')
          .filter((q: FilterBuilder<NamedTableInfo<DataModel, 'programs'>>) =>
            q.or(...candidateProgramIdsArray.map((id: Id<'programs'>) => q.eq(q.field('_id'), id)))
          )
          .collect()

  const programsMap = new Map<Id<'programs'>, ProgramRecord>()
  const providerIds = new Set<Id<'providers'>>()
  for (const program of allPrograms) {
    const typedProgram = program as ProgramRecord
    programsMap.set(typedProgram._id, typedProgram)
    providerIds.add(typedProgram.providerId)
  }

  const providerIdsArray = Array.from(providerIds)
  const allProviders =
    providerIdsArray.length === 0
      ? []
      : await ctx.db
          .query('providers')
          .filter((q: FilterBuilder<NamedTableInfo<DataModel, 'providers'>>) =>
            q.or(...providerIdsArray.map((id: Id<'providers'>) => q.eq(q.field('_id'), id)))
          )
          .collect()

  const providersMap = new Map<Id<'providers'>, ProviderRecord>()
  for (const provider of allProviders) providersMap.set(provider._id, provider as ProviderRecord)

  const results: Array<{
    resource: ResourceRecord
    program: ProgramRecord
    provider: ProviderRecord
    facility: FacilityRecord | null
    serviceArea: ServiceAreaRecord
    zoneMatch: number
    jurisdictionFit: number
    outcomeSignal: number
    rbi: number
  }> = []

  const facilityIds = new Set<Id<'facilities'>>()
  const resourcesByProgram = new Map<Id<'programs'>, ResourceRecord[]>()
  for (const [programId] of Array.from(programsMap.entries())) {
    const MAX_RESOURCES_PER_PROGRAM = 10
    const resources = (await ctx.db
      .query('resources')
      .withIndex('by_program', (q: any) => q.eq('programId', programId))
      .take(MAX_RESOURCES_PER_PROGRAM)) as ResourceRecord[]
    resourcesByProgram.set(programId, resources)
    for (const resource of resources) if (resource.facilityId) facilityIds.add(resource.facilityId)
  }

  const facilityIdsArray = Array.from(facilityIds)
  const allFacilities =
    facilityIdsArray.length === 0
      ? []
      : await ctx.db
          .query('facilities')
          .filter((q: FilterBuilder<NamedTableInfo<DataModel, 'facilities'>>) =>
            q.or(...facilityIdsArray.map((id: Id<'facilities'>) => q.eq(q.field('_id'), id)))
          )
          .collect()

  const facilitiesMap = new Map<Id<'facilities'>, FacilityRecord>()
  for (const facility of allFacilities) facilitiesMap.set(facility._id, facility as FacilityRecord)

  for (const [programId, program] of Array.from(programsMap.entries())) {
    const provider = providersMap.get(program.providerId)
    if (!provider) continue
    const programAreas = candidateAreas.filter(area => area.programId === programId)
    const resources = resourcesByProgram.get(programId) ?? []
    for (const resource of resources) {
      const facility = resource.facilityId ? facilitiesMap.get(resource.facilityId) ?? null : null
      const serviceArea = programAreas[0] ?? fallbackAreas[0] ?? undefined
      const zoneMatch = estimateZoneMatch(program.pressureZones, args.zones ?? undefined)
      const jurisdictionFit = scoreJurisdictionFit(serviceArea?.type, resource.jurisdictionLevel)
      const { success, issue } = ensureDefaultCounts(resource)
      const outcomeSignal = computeOutcomeSignal(success, issue)
      const rbi = calculateRbi({
        zoneMatch,
        verificationStatus: resource.verificationStatus,
        lastVerifiedDate: resource.lastVerifiedDate,
        jurisdictionFit,
        outcomeSignal,
        brokenLink: resource.brokenLink,
        bounceCount: resource.bounceCount,
      })
      const bandMultiplier =
        args.bands && args.bands.includes('crisis') && resource.verificationStatus === 'verified_full'
          ? 1.05
          : 1
      const adjustedRbi = clamp(Math.round(rbi * bandMultiplier))
      results.push({
        resource,
        program,
        provider,
        facility,
        serviceArea,
        zoneMatch,
        jurisdictionFit,
        outcomeSignal,
        rbi: adjustedRbi,
      })
    }
  }

  results.sort((a, b) => b.rbi - a.rbi || (b.resource.scoreRbi ?? 0) - (a.resource.scoreRbi ?? 0))
  return results.slice(0, limit)
}

