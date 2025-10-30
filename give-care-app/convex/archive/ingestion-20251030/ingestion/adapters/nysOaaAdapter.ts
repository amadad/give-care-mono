/**
 * NYS Office for the Aging (OAA) Adapter
 *
 * Source-specific parsing logic ONLY (50-100 lines).
 * All normalization/loading is handled by shared functions.
 */

import { IntermediateRecord } from '../shared/types'

/**
 * Parse NYS OAA text format into intermediate format
 *
 * Input: Semi-structured text (see source/food.md)
 * Output: Array of IntermediateRecord
 */
export function parseNysOaa(fileContent: string): IntermediateRecord[] {
  const records: IntermediateRecord[] = []
  const sections = fileContent.split(/\n\n+/)

  let currentRecord: Partial<IntermediateRecord> = {}

  for (const section of sections) {
    const lines = section.trim().split('\n')

    // First line is title (unless it's a field label)
    if (lines[0] && !lines[0].includes(':')) {
      // Save previous record (with required fields)
      if (currentRecord.title && currentRecord.providerName) {
        records.push(finalizeRecord(currentRecord))
      }

      // Start new record
      currentRecord = { title: lines[0].trim(), description: '' }

      // Description lines (until we hit field labels)
      const descLines: string[] = []
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes(':')) break
        descLines.push(lines[i].trim())
      }
      currentRecord.description = descLines.join(' ').trim()
    }

    // Parse field labels
    for (const line of lines) {
      if (line.includes('Provider:')) {
        currentRecord.providerName = line.split('Provider:')[1]?.trim() || ''
      } else if (line.includes('Address:')) {
        currentRecord.address = line.split('Address:')[1]?.trim()
      } else if (line.includes('Telephone:')) {
        const phone = line.split('Telephone:')[1]?.trim()
        if (phone) {
          currentRecord.phones = [phone]
        }
      } else if (line.includes('Email:')) {
        currentRecord.email = line.split('Email:')[1]?.trim()
      } else if (line.includes('Website:')) {
        currentRecord.website = line.split('Website:')[1]?.trim()
      }
    }
  }

  // Save last record
  if (currentRecord.title && currentRecord.providerName) {
    records.push(finalizeRecord(currentRecord))
  }

  return records
}

/**
 * Add required fields to complete IntermediateRecord
 */
function finalizeRecord(partial: Partial<IntermediateRecord>): IntermediateRecord {
  return {
    ...partial,
    title: partial.title!,
    providerName: partial.providerName!,
    // Required fields with defaults
    serviceTypes: ['navigation'], // Default for NYS OAA programs
    zones: ['social_support', 'financial_concerns'], // Common zones for aging services
    coverage: 'state', // NYS programs are state-level
    dataSourceType: 'manual_entry' as const,
    aggregatorSource: 'other' as const, // NYS OAA is not one of the predefined aggregators
    fundingSource: 'state' as const,
  }
}
