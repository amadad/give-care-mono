/**
 * Validation gates for IntermediateRecord
 *
 * Fail fast with clear error messages.
 */

import { IntermediateRecord } from './types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate IntermediateRecord meets production contract
 */
export function validateRecord(record: IntermediateRecord): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // REQUIRED: title
  if (!record.title || record.title.trim() === '') {
    errors.push('title is required and cannot be empty')
  }

  // REQUIRED: providerName
  if (!record.providerName || record.providerName.trim() === '') {
    errors.push('providerName is required and cannot be empty')
  }

  // REQUIRED: at least one of (phones | website)
  const hasContact =
    (record.phones && record.phones.length > 0) || (record.website && record.website.trim() !== '')

  if (!hasContact) {
    errors.push('at least one of (phones, website) is required')
  }

  // REQUIRED: at least one of (serviceTypes | zones)
  const hasCategories =
    (record.serviceTypes && record.serviceTypes.length > 0) ||
    (record.zones && record.zones.length > 0)

  if (!hasCategories) {
    errors.push('at least one of (serviceTypes, zones) is required')
  }

  // REQUIRED: coverage
  const validCoverageTypes = ['national', 'state', 'county', 'zip', 'radius']
  if (!record.coverage || !validCoverageTypes.includes(record.coverage)) {
    errors.push(`coverage must be one of: ${validCoverageTypes.join(', ')}`)
  }

  // REQUIRED: dataSourceType
  const validDataSourceTypes = ['scraped', 'manual_entry', 'api']
  if (!record.dataSourceType || !validDataSourceTypes.includes(record.dataSourceType)) {
    errors.push(`dataSourceType must be one of: ${validDataSourceTypes.join(', ')}`)
  }

  // REQUIRED: aggregatorSource
  const validAggregatorSources = ['eldercare', '211', 'carelinq', 'manual', 'other']
  if (!record.aggregatorSource || !validAggregatorSources.includes(record.aggregatorSource)) {
    errors.push(`aggregatorSource must be one of: ${validAggregatorSources.join(', ')}`)
  }

  // WARNINGS: Recommended fields
  if (!record.zip && !record.state && record.coverage !== 'national') {
    warnings.push('no ZIP or state provided for non-national resource')
  }

  if (!record.description) {
    warnings.push('description is empty; helps with user comprehension')
  }

  if (!record.lastVerified) {
    warnings.push('lastVerified not provided; will default to import date')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Canonical key for deduplication
 *
 * Same provider + phone + geo = same resource
 */
export function canonicalKey(record: IntermediateRecord): string {
  const name = record.providerName.trim().toLowerCase().replace(/\W+/g, '')

  const phone = (record.phones?.[0] ?? '').replace(/\D/g, '')

  const geo = record.coverage === 'national' ? 'US' : (record.zip ?? record.state ?? 'unknown')

  return `${name}:${phone}:${geo}`
}

/**
 * Phone normalization to E.164 format
 *
 * Simplified for US numbers (for full international support, use libphonenumber)
 */
export function normalizePhoneE164(phone: string): string | null {
  if (!phone) return null

  const digits = phone.replace(/\D/g, '')

  // US number (10 digits)
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // US number with country code (11 digits starting with 1)
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`
  }

  // 3-digit hotline (988, 211, 988)
  if (digits.length === 3) {
    return digits // Keep as-is for hotlines
  }

  // Toll-free (1-800-xxx-xxxx)
  if (digits.length === 11 && digits[0] === '1' && /^1[89]00/.test(digits)) {
    return `+${digits}`
  }

  // Invalid format
  return null
}

/**
 * URL validation (basic check)
 *
 * For production, add HTTP HEAD check to verify URL is reachable
 */
export function validateUrl(url: string): boolean {
  if (!url || url.trim() === '') return false

  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    new URL(normalized)
    return true
  } catch {
    return false
  }
}
