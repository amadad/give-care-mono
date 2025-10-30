/**
 * Eldercare Locator API Adapter
 *
 * Parses JSON responses from eldercare.acl.gov API
 * Only 40 lines of source-specific logic!
 */

import { IntermediateRecord } from '../shared/types'

interface EldercareApiResponse {
  Organizations: Array<{
    Name: string
    OrgType: string
    Website: string
    Address1: string
    City: string
    State: string
    Zip: string
    Phone: string
    Email: string
    Services: string
  }>
}

/**
 * Parse Eldercare Locator API response
 */
export function parseEldercareLocator(apiResponse: EldercareApiResponse): IntermediateRecord[] {
  return apiResponse.Organizations.map(org => ({
    title: org.Services || org.Name, // Use service name as title
    description: `Services provided by ${org.Name}`,
    providerName: org.Name,
    phones: org.Phone ? [org.Phone] : undefined,
    address: org.Address1,
    city: org.City,
    state: org.State,
    zip: org.Zip,
    email: org.Email,
    website: org.Website,
    // Parse services into service types (simplified - could be more sophisticated)
    serviceTypes: org.Services ? parseServiceTypes(org.Services) : ['navigation'],
    zones: ['social_support'], // Default zone for eldercare services
    coverage: org.State ? 'state' : 'county', // Assume state-level coverage
    sourceUrl: 'https://eldercare.acl.gov',
    dataSourceType: 'api' as const,
    aggregatorSource: 'eldercare' as const,
    fundingSource: 'federal' as const,
  }))
}

/**
 * Parse service string into service type array
 */
function parseServiceTypes(services: string): string[] {
  const serviceMap: Record<string, string> = {
    respite: 'respite',
    'support group': 'caregiver_support',
    counseling: 'counseling',
    'adult day': 'respite',
    legal: 'legal_planning',
    financial: 'financial_assistance',
    navigator: 'navigation',
    'case management': 'navigation',
  }

  const lower = services.toLowerCase()
  const types: string[] = []

  for (const [keyword, type] of Object.entries(serviceMap)) {
    if (lower.includes(keyword)) {
      types.push(type)
    }
  }

  return types.length > 0 ? types : ['navigation']
}
