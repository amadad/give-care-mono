/**
 * Universal Resource Importer
 *
 * Supports multiple data sources through a common pipeline:
 * 1. Source adapter parses format → IntermediateRecord[]
 * 2. Shared normalize function → NormalizedRecord[]
 * 3. Shared load function → Database records
 *
 * Adding a new source = 50 lines of adapter code, that's it!
 */

import { internalMutation } from '../_generated/server'
import type { MutationCtx } from '../_generated/server'
import { v } from 'convex/values'
import { normalizeRecord } from './shared/normalize'
import { loadNormalizedRecords } from './shared/load'
import type { IntermediateRecord, NormalizedRecord } from './shared/types'

// Import all adapters
import { parseNysOaa } from './adapters/nysOaaAdapter'
import { parseEldercareLocator } from './adapters/eldercareLocatorAdapter'
import { parseOpenReferral } from './adapters/openReferralAdapter'

type ImportSource = 'nys_oaa' | 'eldercare_locator' | 'open_referral'

type ImportMetadata = {
  license?: string
  fundingSource?: string
}

type ImportResourcesArgs = {
  source: ImportSource
  data: unknown
  metadata?: ImportMetadata
}

const DATA_SOURCE_DEFAULTS: Record<ImportSource, IntermediateRecord['dataSourceType']> = {
  nys_oaa: 'manual_entry',
  eldercare_locator: 'api',
  open_referral: 'api',
}

const AGGREGATOR_DEFAULTS: Record<ImportSource, IntermediateRecord['aggregatorSource']> = {
  nys_oaa: 'other',
  eldercare_locator: 'eldercare',
  open_referral: '211',
}

// ============================================================================
// MAIN IMPORT MUTATION
// ============================================================================

// Internal handler function (can be called directly)
async function importResourcesHandler(
  ctx: MutationCtx,
  args: ImportResourcesArgs
) {
  const { source, data, metadata } = args
  console.log(`🚀 Starting import from source: ${source}`)

  // STEP 1: Parse (source-specific)
  let intermediateRecords: IntermediateRecord[]

  switch (source) {
    case 'nys_oaa':
      if (typeof data !== 'string') {
        throw new Error('NYS OAA import expects file content as string')
      }
      intermediateRecords = parseNysOaa(data)
      break

    case 'eldercare_locator':
      intermediateRecords = parseEldercareLocator(data as Parameters<typeof parseEldercareLocator>[0])
      break

    case 'open_referral':
      intermediateRecords = parseOpenReferral(data as Parameters<typeof parseOpenReferral>[0])
      break

    default:
      throw new Error(`Unknown source: ${source}`)
  }

  console.log(`📊 Parsed ${intermediateRecords.length} records`)

  // STEP 2: Normalize (shared logic for ALL sources)
  const enrichedRecords = intermediateRecords.map(record => ({
    ...record,
    dataSourceType: record.dataSourceType ?? DATA_SOURCE_DEFAULTS[source],
    aggregatorSource: record.aggregatorSource ?? AGGREGATOR_DEFAULTS[source],
  }))

  const normalizedRecords: NormalizedRecord[] = enrichedRecords.map(record => {
    const normalized = normalizeRecord(record)

    return {
      ...normalized,
      provider: {
        ...normalized.provider,
        license: metadata?.license ?? normalized.provider.license,
      },
      program: {
        ...normalized.program,
        fundingSource: metadata?.fundingSource ?? normalized.program.fundingSource,
      },
    }
  })

  console.log(`✅ Normalized ${normalizedRecords.length} records`)

  // STEP 3: Load (shared logic for ALL sources)
  const result = await loadNormalizedRecords(ctx, normalizedRecords)

  console.log(`✨ Import complete: ${result.imported} imported, ${result.failed} failed`)

  return result
}

export const importResources = internalMutation({
  args: {
    source: v.union(
      v.literal('nys_oaa'),
      v.literal('eldercare_locator'),
      v.literal('open_referral')
    ),
    data: v.any(), // Could be string (text file), JSON (API response), etc.
    metadata: v.optional(
      v.object({
        license: v.optional(v.string()),
        fundingSource: v.optional(v.string()),
      })
    ),
  },
  handler: importResourcesHandler,
})

// ============================================================================
// CONVENIENCE MUTATIONS (One per source)
// ============================================================================

/**
 * Import NYS OAA food resources
 */
export const importNysOaa = internalMutation({
  args: {
    fileContent: v.string(),
  },
  handler: async (ctx, { fileContent }) => {
    return await importResourcesHandler(ctx, {
      source: 'nys_oaa',
      data: fileContent,
      metadata: {
        license: 'NYS Office for the Aging (OAA) data',
        fundingSource: 'NYS Office for the Aging / Federal grants',
      },
    })
  },
})

/**
 * Import Eldercare Locator API response
 */
export const importEldercareLocator = internalMutation({
  args: {
    apiResponse: v.any(),
  },
  handler: async (ctx, { apiResponse }) => {
    return await importResourcesHandler(ctx, {
      source: 'eldercare_locator',
      data: apiResponse,
      metadata: {
        license: 'Public Domain (ACL/eldercare.acl.gov)',
        fundingSource: 'Administration for Community Living (ACL)',
      },
    })
  },
})

/**
 * Import Open Referral (HSDS) data
 */
export const importOpenReferral = internalMutation({
  args: {
    services: v.any(),
  },
  handler: async (ctx, { services }) => {
    return await importResourcesHandler(ctx, {
      source: 'open_referral',
      data: services,
      metadata: {
        license: 'Varies by provider (check source)',
        fundingSource: 'Multiple sources',
      },
    })
  },
})
