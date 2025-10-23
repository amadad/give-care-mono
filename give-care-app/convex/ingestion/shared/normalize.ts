/**
 * Shared normalization functions (used by ALL source adapters)
 *
 * These functions are source-agnostic and handle:
 * - Phone number normalization (E.164 format)
 * - URL normalization (add https://, validate)
 * - Address parsing (extract ZIP, city, state)
 * - Categorization (keywords → resource categories)
 * - Pressure zone mapping (categories → zones)
 * - Sector inference (provider name → public/nonprofit/faith-based)
 */

import { IntermediateRecord, NormalizedRecord } from './types'
import { validateRecord, normalizePhoneE164, validateUrl, canonicalKey } from './validation'
import { mapServicesToZones } from './registry'

// ============================================================================
// CONTACT INFO NORMALIZATION
// ============================================================================

export function normalizePhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined

  const digits = phone.replace(/\D/g, '')

  if (digits.length === 10) {
    return `+1${digits}` // US number
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}` // Already has country code
  }

  return undefined // Invalid
}

export function normalizeUrl(url: string | undefined | null): string | undefined {
  if (!url || url === 'N/A' || url.trim() === '') return undefined

  try {
    // Add https:// if missing
    const normalized = url.startsWith('http') ? url : `https://${url}`

    // Validate
    new URL(normalized)

    return normalized
  } catch {
    return undefined // Invalid URL
  }
}

export function normalizeEmail(email: string | undefined | null): string | undefined {
  if (!email || email === 'N/A') return undefined

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? email.toLowerCase() : undefined
}

// ============================================================================
// ADDRESS PARSING
// ============================================================================

export interface ParsedAddress {
  street?: string
  city?: string
  state?: string
  zip?: string
}

export function parseAddress(
  address: string | undefined,
  city: string | undefined,
  state: string | undefined,
  zip: string | undefined
): ParsedAddress {
  // If fields are already separated, use them
  if (city && state && zip) {
    return {
      street: address || undefined,
      city,
      state,
      zip,
    }
  }

  // Otherwise, try to parse from combined address string
  if (!address) {
    return { street: undefined, city: undefined, state: undefined, zip: undefined }
  }

  // Extract ZIP code (5 digits)
  const zipMatch = address.match(/\b(\d{5})(-\d{4})?\b/)
  const extractedZip = zipMatch ? zipMatch[1] : zip || undefined

  // Extract state (2 uppercase letters)
  const stateMatch = address.match(/\b([A-Z]{2})\b/)
  const extractedState = stateMatch ? stateMatch[1] : state || undefined

  // City is usually the part before state/ZIP
  // Pattern: "Street, City, State ZIP"
  const parts = address.split(',').map(p => p.trim())
  let extractedCity = city || undefined

  if (parts.length >= 2) {
    extractedCity = parts[parts.length - 2] || undefined
  }

  // Street is everything before city
  const street = parts.slice(0, -2).join(', ') || address

  return {
    street,
    city: extractedCity,
    state: extractedState,
    zip: extractedZip,
  }
}

// ============================================================================
// CATEGORIZATION
// ============================================================================

const CATEGORY_KEYWORDS: Record<string, string> = {
  // Food-related
  'food pantry': 'financial_assistance',
  'emergency food': 'financial_assistance',
  meal: 'caregiver_support',
  lunch: 'caregiver_support',
  dinner: 'caregiver_support',
  breakfast: 'caregiver_support',
  'home delivered': 'navigation',
  'meals on wheels': 'navigation',

  // Respite
  respite: 'respite',
  'adult day': 'respite',
  'day care': 'respite',

  // Support
  'support group': 'caregiver_support',
  'peer support': 'caregiver_support',
  caregiver: 'caregiver_support',

  // Counseling
  counseling: 'counseling',
  therapy: 'counseling',
  crisis: 'counseling',
  hotline: 'counseling',

  // Education
  training: 'education_training',
  class: 'education_training',
  workshop: 'education_training',
  education: 'education_training',

  // Navigation
  navigator: 'navigation',
  'case management': 'navigation',
  benefits: 'navigation',

  // Equipment
  equipment: 'equipment_devices',
  assistive: 'equipment_devices',
  'durable medical': 'equipment_devices',

  // Legal
  legal: 'legal_planning',
  attorney: 'legal_planning',
  'advance directive': 'legal_planning',

  // Financial
  financial: 'financial_assistance',
  stipend: 'financial_assistance',
  grant: 'financial_assistance',
  voucher: 'financial_assistance',
}

export function categorizeService(text: string): string[] {
  const lower = text.toLowerCase()
  const categories = new Set<string>()

  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      categories.add(category)
    }
  }

  // Default if nothing matched
  if (categories.size === 0) {
    categories.add('navigation')
  }

  return Array.from(categories)
}

// ============================================================================
// PRESSURE ZONE MAPPING
// ============================================================================

const CATEGORY_TO_ZONES: Record<string, string[]> = {
  respite: ['time_management', 'physical_health'],
  caregiver_support: ['social_support', 'emotional_wellbeing'],
  counseling: ['emotional_wellbeing'],
  education_training: ['time_management', 'emotional_wellbeing'],
  navigation: ['financial_concerns', 'social_support'],
  equipment_devices: ['physical_health', 'financial_concerns'],
  legal_planning: ['financial_concerns'],
  financial_assistance: ['financial_concerns'],
}

export function mapCategoriesToZones(categories: string[]): string[] {
  const zones = new Set<string>()

  for (const category of categories) {
    const zonesList = CATEGORY_TO_ZONES[category]
    if (zonesList) {
      zonesList.forEach(zone => zones.add(zone))
    }
  }

  return Array.from(zones)
}

// ============================================================================
// SECTOR INFERENCE
// ============================================================================

export function inferSector(providerName: string): string {
  const lower = providerName.toLowerCase()

  if (
    lower.includes('county') ||
    lower.includes('office for aging') ||
    lower.includes('area agency')
  ) {
    return 'public_local'
  }

  if (lower.includes('state') || lower.includes('new york state')) {
    return 'public_state'
  }

  if (lower.includes('federal') || lower.includes('medicare') || lower.includes('medicaid')) {
    return 'public_federal'
  }

  if (lower.includes('va') || lower.includes('veterans affairs')) {
    return 'va'
  }

  if (lower.includes('church') || lower.includes('ministries') || lower.includes('cathedral')) {
    return 'faith_based'
  }

  if (lower.includes('ymca') || lower.includes('nonprofit') || lower.includes('community')) {
    return 'nonprofit'
  }

  if (lower.includes('cbo') || lower.includes('community-based')) {
    return 'cbo'
  }

  return 'nonprofit' // Default
}

// ============================================================================
// ELIGIBILITY EXTRACTION
// ============================================================================

export function extractEligibility(text: string): string | null {
  const lower = text.toLowerCase()

  if (lower.includes('60+') || lower.includes('age 60') || lower.includes('over 60')) {
    return 'Age 60+, caregivers of older adults'
  }

  if (lower.includes('low-income') || lower.includes('low income')) {
    return 'Low-income individuals and families'
  }

  if (lower.includes('no income restriction') || lower.includes('open to all')) {
    return 'Open to all'
  }

  if (lower.includes('veteran') || lower.includes('va')) {
    return 'Veterans and their caregivers'
  }

  return null // Will default to "Contact provider for details"
}

// ============================================================================
// FULL NORMALIZATION PIPELINE
// ============================================================================

/**
 * Normalize IntermediateRecord → NormalizedRecord
 *
 * VALIDATION: Throws error if record fails validation
 */
export function normalizeRecord(raw: IntermediateRecord): NormalizedRecord {
  const now = Date.now()

  // STEP 1: Validate
  const validation = validateRecord(raw)
  if (!validation.valid) {
    throw new Error(`Validation failed for ${raw.title}: ${validation.errors.join(', ')}`)
  }

  // Log warnings (non-fatal)
  if (validation.warnings.length > 0) {
    console.warn(`Warnings for ${raw.title}:`, validation.warnings)
  }

  // STEP 2: Normalize phones
  const normalizedPhones = (raw.phones || [])
    .map(p => normalizePhoneE164(p))
    .filter((p): p is string => p !== null)

  // STEP 3: Parse address
  const parsedAddress = parseAddress(raw.address, raw.city, raw.state, raw.zip)

  // STEP 4: Merge zones from serviceTypes + explicit zones
  let zones = [...raw.zones]
  if (raw.serviceTypes && raw.serviceTypes.length > 0) {
    const mappedZones = mapServicesToZones(raw.serviceTypes)
    zones = [...new Set([...zones, ...mappedZones])]
  }

  // STEP 5: Extract eligibility
  const eligibility =
    raw.eligibility ||
    extractEligibility(raw.description || raw.title) ||
    'Contact provider for details'

  // STEP 6: Map coverage to service area
  const serviceAreaMapping: Record<
    string,
    'county' | 'city' | 'zip_cluster' | 'statewide' | 'national'
  > = {
    national: 'national',
    state: 'statewide',
    county: 'county',
    zip: 'zip_cluster',
    radius: 'zip_cluster',
  }
  const serviceAreaType = serviceAreaMapping[raw.coverage]

  // STEP 7: Generate geo codes
  const geoCodes: string[] = []
  if (serviceAreaType === 'national') {
    geoCodes.push('national')
  } else if (parsedAddress.zip) {
    geoCodes.push(parsedAddress.zip.slice(0, 3)) // ZIP3 cluster
  } else if (parsedAddress.state) {
    geoCodes.push(parsedAddress.state) // State code
  }

  // STEP 8: Normalize URL
  const primaryUrl = validateUrl(raw.website || '')
    ? raw.website!.startsWith('http')
      ? raw.website
      : `https://${raw.website}`
    : undefined

  return {
    program: {
      name: raw.title,
      description: raw.description || '',
      resourceCategory: raw.serviceTypes,
      pressureZones: zones,
      eligibility,
      languageSupport: raw.languages || ['en'],
      fundingSource: raw.fundingSource,
    },

    provider: {
      name: raw.providerName,
      sector: inferSector(raw.providerName),
      operatorUrl: primaryUrl,
      license: raw.license || 'Unknown',
      notes: `Imported from ${raw.aggregatorSource} on ${new Date().toISOString()}. Last verified: ${raw.lastVerified || 'unknown'}`,
    },

    facility: {
      name: raw.providerName, // Often same as provider for small orgs
      phoneE164: normalizedPhones[0] || undefined,
      email: normalizeEmail(raw.email),
      address: parsedAddress.street,
      city: parsedAddress.city,
      state: parsedAddress.state,
      zip: parsedAddress.zip,
      geo: raw.lat && raw.lng ? { lat: raw.lat, lon: raw.lng } : undefined,
      hours: raw.hours || undefined,
      languages: raw.languages || ['en'],
    },

    serviceArea: {
      type: serviceAreaType,
      geoCodes,
      jurisdictionLevel: raw.coverage === 'national' ? 'national' : 'county',
    },

    metadata: {
      dataSourceType: raw.dataSourceType,
      aggregatorSource: raw.aggregatorSource,
      externalId: undefined,
      externalUrl: raw.sourceUrl,
    },
  }
}
