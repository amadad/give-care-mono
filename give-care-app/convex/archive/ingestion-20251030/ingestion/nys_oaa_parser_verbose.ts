/**
 * VERBOSE ETL Pipeline - Shows EVERYTHING
 *
 * This version logs every step so you can see exactly what's happening
 *
 * Usage:
 * 1. Copy source/food.md content
 * 2. Run in Convex dashboard:
 *    await ctx.runMutation(api.ingestion.nys_oaa_parser_verbose.importWithLogging, {
 *      fileContent: "...paste here..."
 *    });
 * 3. Watch the logs in real-time
 */

import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

export const importWithLogging = internalMutation({
  args: {
    fileContent: v.string(),
    dryRun: v.optional(v.boolean()), // If true, don't write to DB
  },
  handler: async (ctx, { fileContent, dryRun = false }) => {
    const logs: string[] = []
    const log = (msg: string) => {
      console.log(msg)
      logs.push(msg)
    }

    log('\n═══════════════════════════════════════════════════════════')
    log('STEP 1: PARSE - Extract structured data from text')
    log('═══════════════════════════════════════════════════════════\n')

    // Parse first record manually to show example
    const firstRecordText = fileContent.slice(0, 500)
    log('Example raw text (first 500 chars):')
    log('─────────────────────────────────────────────────────────')
    log(firstRecordText)
    log('...\n')

    // Simple parser (counts records by "Provider:" keyword)
    const providerMatches = fileContent.match(/Provider:/g)
    const recordCount = providerMatches?.length || 0

    log(`✅ Found ${recordCount} records (detected by "Provider:" keyword)\n`)

    // Show what would be extracted from first record
    log('Example parsed fields from first record:')
    log('─────────────────────────────────────────────────────────')
    const titleMatch = fileContent.match(/^([^\n]+)/)
    const providerMatch = fileContent.match(/Provider:([^\n]+)/)
    const phoneMatch = fileContent.match(/Telephone:\s*([^\n]+)/)
    const zipMatch = fileContent.match(/\b(\d{5})\b/)

    log(`  title:    "${titleMatch?.[1] || 'N/A'}"`)
    log(`  provider: "${providerMatch?.[1]?.trim() || 'N/A'}"`)
    log(`  phone:    "${phoneMatch?.[1]?.trim() || 'N/A'}"`)
    log(`  zip:      "${zipMatch?.[1] || 'N/A'}"\n`)

    log('\n═══════════════════════════════════════════════════════════')
    log('STEP 2: TRANSFORM - Normalize & categorize')
    log('═══════════════════════════════════════════════════════════\n')

    // Show transformations
    const rawPhone = phoneMatch?.[1]?.trim() || ''
    const normalizedPhone = rawPhone.replace(/\D/g, '').slice(0, 10)
    const phoneE164 = normalizedPhone.length === 10 ? `+1${normalizedPhone}` : null

    log('Phone normalization:')
    log(`  Input:  "${rawPhone}"`)
    log(`  Output: "${phoneE164}"\n`)

    // Categorization
    const titleLower = (titleMatch?.[1] || '').toLowerCase()
    let category = 'navigation'
    let zones: string[] = []

    if (titleLower.includes('lunch') || titleLower.includes('meal')) {
      category = 'caregiver_support'
      zones = ['time_management', 'physical_health']
    }

    log('Categorization (keyword matching):')
    log(`  Title: "${titleMatch?.[1] || 'N/A'}"`)
    log(`  Keywords detected: ${titleLower.includes('lunch') ? '"lunch"' : 'none'}`)
    log(`  Category: "${category}"`)
    log(`  Zones: ${JSON.stringify(zones)}\n`)

    log('\n═══════════════════════════════════════════════════════════')
    log('STEP 3: FILTER - Remove invalid/junk records')
    log('═══════════════════════════════════════════════════════════\n')

    const hasZip = !!zipMatch
    const isJunk =
      titleLower.includes('emergency operations') || titleLower.includes('environmental')

    log('Validation checks:')
    log(`  Has ZIP code? ${hasZip ? '✅ Yes' : '❌ No'}`)
    log(`  Is junk? ${isJunk ? '❌ Yes' : '✅ No'}`)
    log(`  Verdict: ${hasZip && !isJunk ? '✅ KEEP' : '❌ FILTER OUT'}\n`)

    const estimatedValid = Math.floor(recordCount * 0.85) // ~85% pass rate
    log(`Estimated valid records: ~${estimatedValid} / ${recordCount}\n`)

    log('\n═══════════════════════════════════════════════════════════')
    log('STEP 4: LOAD - Create database records')
    log('═══════════════════════════════════════════════════════════\n')

    if (dryRun) {
      log('🔒 DRY RUN MODE - No database writes\n')
      log('Would create the following records:\n')

      log('1️⃣  providers table:')
      log('    {')
      log(`      name: "${providerMatch?.[1]?.trim() || 'N/A'}",`)
      log('      sector: "public_local",')
      log('      license: "NYS OAA data"')
      log('    }\n')

      log('2️⃣  facilities table:')
      log('    {')
      log(`      phoneE164: "${phoneE164}",`)
      log(`      zip: "${zipMatch?.[1] || 'N/A'}"`)
      log('    }\n')

      log('3️⃣  programs table:')
      log('    {')
      log(`      name: "${titleMatch?.[1] || 'N/A'}",`)
      log(`      resourceCategory: ["${category}"],`)
      log(`      pressureZones: ${JSON.stringify(zones)}`)
      log('    }\n')

      log('4️⃣  serviceAreas table:')
      log('    {')
      log(`      geoCodes: ["${zipMatch?.[1]?.slice(0, 3) || 'N/A'}"],  // ZIP3`)
      log('      type: "county"')
      log('    }\n')

      log('5️⃣  resources table (joins all):')
      log('    {')
      log('      programId: <from step 3>,')
      log('      facilityId: <from step 2>,')
      log('      verificationStatus: "unverified",')
      log('      aggregatorSource: "nys_oaa"')
      log('    }\n')

      log(
        `Total: ${estimatedValid} resources × 5 tables = ~${estimatedValid * 5} database records\n`
      )
    } else {
      log('💾 WRITING TO DATABASE...\n')

      // Create one example record to demonstrate
      try {
        // Create provider
        const providerId = await ctx.db.insert('providers', {
          name: providerMatch?.[1]?.trim() || 'Test Provider',
          sector: 'public_local',
          operatorUrl: undefined,
          license: 'NYS Office for the Aging (OAA) data',
          notes: 'Demo import from verbose parser',
          tosAllowsScrape: undefined,
          robotsAllowed: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        log(`✅ Created provider: ${providerId}\n`)

        // Create facility
        const facilityId = await ctx.db.insert('facilities', {
          providerId,
          name: providerMatch?.[1]?.trim() || 'Test Facility',
          phoneE164: phoneE164 || undefined,
          email: undefined,
          address: undefined,
          zip: zipMatch?.[1] || undefined,
          geo: undefined,
          hours: undefined,
          languages: ['en'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        log(`✅ Created facility: ${facilityId}\n`)

        // Create program
        const programId = await ctx.db.insert('programs', {
          providerId,
          name: titleMatch?.[1] || 'Test Program',
          description: undefined,
          resourceCategory: [category],
          pressureZones: zones,
          fundingSource: 'NYS OAA',
          eligibility: 'Age 60+',
          languageSupport: ['en'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        log(`✅ Created program: ${programId}\n`)

        // Create service area
        const serviceAreaId = await ctx.db.insert('serviceAreas', {
          programId,
          type: 'county',
          geoCodes: [zipMatch?.[1]?.slice(0, 3) || '000'],
          jurisdictionLevel: 'county',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        log(`✅ Created service area: ${serviceAreaId}\n`)

        // Create resource
        const resourceId = await ctx.db.insert('resources', {
          programId,
          facilityId,
          primaryUrl: undefined,
          dataSourceType: 'manual_entry',
          aggregatorSource: 'nys_oaa',
          verificationStatus: 'unverified',
          lastCrawledAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        log(`✅ Created resource: ${resourceId}\n`)

        log('💾 Database write successful!\n')
        log(
          `📊 Created 5 records (1 provider, 1 facility, 1 program, 1 service area, 1 resource)\n`
        )
      } catch (error) {
        log(`❌ Error: ${error}\n`)
      }
    }

    log('\n═══════════════════════════════════════════════════════════')
    log('SUMMARY')
    log('═══════════════════════════════════════════════════════════\n')

    log(`📄 Input: ${(fileContent.length / 1024).toFixed(2)} KB`)
    log(`📊 Detected: ${recordCount} records`)
    log(`✅ Estimated valid: ~${estimatedValid}`)
    log(`💾 Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE (wrote to database)'}\n`)

    log('Next steps:')
    log('  1. Run full import with real parser')
    log('  2. Verify 10 resources (call facilities)')
    log('  3. Test matching with real users')
    log('  4. Track feedback (RBI scoring)\n')

    return {
      success: true,
      recordsDetected: recordCount,
      estimatedValid,
      dryRun,
      logs: logs.join('\n'),
    }
  },
})
