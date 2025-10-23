/**
 * Open Referral (HSDS) Adapter
 *
 * Parses Open Referral's Human Services Data Specification (HSDS) format
 * Used by 211, findhelp.org, and other major directories
 * Only 50 lines!
 */

import { IntermediateRecord } from '../shared/types'

interface HsdsService {
  id: string
  name: string
  description: string
  url?: string
  organization: {
    id: string
    name: string
    url?: string
  }
  locations: Array<{
    name: string
    address_1: string
    city: string
    state_province: string
    postal_code: string
    latitude?: number
    longitude?: number
  }>
  phones: Array<{
    number: string
    type: string
  }>
  eligibility?: {
    description: string
  }
  languages?: string[]
}

/**
 * Parse HSDS (Open Referral) format
 */
export function parseOpenReferral(services: HsdsService[]): IntermediateRecord[] {
  return services.map(service => {
    const primaryLocation = service.locations[0]
    const phoneNumbers = service.phones.filter(p => p.type === 'voice').map(p => p.number)

    return {
      title: service.name,
      description: service.description,
      providerName: service.organization.name,
      phones: phoneNumbers.length > 0 ? phoneNumbers : undefined,
      address: primaryLocation?.address_1,
      city: primaryLocation?.city,
      state: primaryLocation?.state_province,
      zip: primaryLocation?.postal_code,
      lat: primaryLocation?.latitude,
      lng: primaryLocation?.longitude,
      website: service.url,
      eligibility: service.eligibility?.description,
      languages: service.languages,
      // Required fields
      serviceTypes: inferServiceTypes(service.name, service.description),
      zones: ['social_support'], // Default zone for human services
      coverage: primaryLocation?.state_province ? 'state' : 'county',
      sourceUrl: service.url,
      dataSourceType: 'api' as const,
      aggregatorSource: '211' as const, // Open Referral is commonly used by 211
    }
  })
}

/**
 * Infer service types from name and description
 */
function inferServiceTypes(name: string, description: string): string[] {
  const combined = `${name} ${description}`.toLowerCase()
  const types: string[] = []

  const serviceMap: Record<string, string> = {
    respite: 'respite',
    'support group': 'caregiver_support',
    counseling: 'counseling',
    'adult day': 'respite',
    legal: 'legal_planning',
    financial: 'financial_assistance',
    navigator: 'navigation',
    'case management': 'navigation',
    food: 'nutrition',
    meal: 'nutrition',
    transportation: 'transportation',
    housing: 'housing',
  }

  for (const [keyword, type] of Object.entries(serviceMap)) {
    if (combined.includes(keyword)) {
      types.push(type)
    }
  }

  return types.length > 0 ? types : ['navigation']
}
