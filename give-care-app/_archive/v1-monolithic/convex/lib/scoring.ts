/**
 * Resource scoring algorithm
 *
 * Combines zone match, coverage precision, freshness, and verification status
 * to produce a 0-100 RBI (Resource Benefit Index) score.
 */

/**
 * Calculate RBI score for a resource
 *
 * @param zoneMatch - Does resource match user's pressure zones?
 * @param coverage - Geographic coverage type
 * @param freshnessDays - Days since last verification
 * @param verified - Is resource verified?
 * @returns Score 0-100 (higher is better)
 */
export function scoreResource({
  zoneMatch,
  coverage,
  freshnessDays,
  verified,
}: {
  zoneMatch: boolean
  coverage: 'national' | 'state' | 'county' | 'zip' | 'radius'
  freshnessDays: number
  verified: boolean
}): number {
  // Coverage score (more local = better)
  const coverageScores = {
    national: 0.6,
    state: 0.8,
    county: 0.9,
    zip: 1.0,
    radius: 1.0,
  }
  const coverageScore = coverageScores[coverage] ?? 0.7

  // Freshness score (linear decay over 1 year)
  const freshnessScore = Math.max(0, 1 - freshnessDays / 365)

  // Zone match score (matched = 0.5, not matched = 0.2)
  const zoneScore = zoneMatch ? 0.5 : 0.2

  // Verification bonus
  const verificationBonus = verified ? 0.05 : 0

  // Weighted sum
  const rawScore =
    zoneScore + // 50% weight (0.2-0.5)
    0.3 * coverageScore + // 30% weight (0.18-0.3)
    0.15 * freshnessScore + // 15% weight (0-0.15)
    verificationBonus // 5% bonus (0-0.05)

  // Convert to 0-100 scale
  return Math.round(rawScore * 100)
}

/**
 * Check if resource matches user's pressure zones
 */
export function matchesZones(resourceZones: string[], userZones: string[] | undefined): boolean {
  if (!userZones || userZones.length === 0) {
    return false // No zones to match
  }

  const resourceSet = new Set(resourceZones)
  return userZones.some(zone => resourceSet.has(zone))
}

/**
 * Calculate freshness in days since last verification
 */
export function calculateFreshness(lastVerified: string | number | undefined): number {
  if (!lastVerified) {
    return 365 // Assume 1 year old if unknown
  }

  const verifiedDate =
    typeof lastVerified === 'string' ? new Date(lastVerified).getTime() : lastVerified

  const daysSince = (Date.now() - verifiedDate) / (1000 * 60 * 60 * 24)

  return Math.max(0, Math.round(daysSince))
}
