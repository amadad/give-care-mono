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


import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { normalizeRecord } from "./shared/normalize";
import { loadNormalizedRecords } from "./shared/load";

// Import all adapters
import { parseNysOaa } from "./adapters/nysOaaAdapter";
import { parseEldercareLocator } from "./adapters/eldercareLocatorAdapter";
import { parseOpenReferral } from "./adapters/openReferralAdapter";

// ============================================================================
// MAIN IMPORT MUTATION
// ============================================================================

export const importResources = internalMutation({
  args: {
    source: v.union(
      v.literal("nys_oaa"),
      v.literal("eldercare_locator"),
      v.literal("open_referral")
    ),
    data: v.any(), // Could be string (text file), JSON (API response), etc.
    metadata: v.optional(
      v.object({
        license: v.optional(v.string()),
        fundingSource: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, { source, data, metadata }) => {
    console.log(`🚀 Starting import from source: ${source}`);

    // STEP 1: Parse (source-specific)
    let intermediateRecords;

    switch (source) {
      case "nys_oaa":
        intermediateRecords = parseNysOaa(data as string);
        break;

      case "eldercare_locator":
        intermediateRecords = parseEldercareLocator(data);
        break;

      case "open_referral":
        intermediateRecords = parseOpenReferral(data);
        break;

      default:
        throw new Error(`Unknown source: ${source}`);
    }

    console.log(`📊 Parsed ${intermediateRecords.length} records`);

    // STEP 2: Normalize (shared logic for ALL sources)
    const normalizedRecords = intermediateRecords.map(record =>
      normalizeRecord(record, {
        dataSourceType: source === "nys_oaa" ? "manual_entry" : "scraped",
        aggregatorSource: source,
        license: metadata?.license || `${source} data`,
        fundingSource: metadata?.fundingSource
      })
    );

    console.log(`✅ Normalized ${normalizedRecords.length} records`);

    // STEP 3: Load (shared logic for ALL sources)
    const result = await loadNormalizedRecords(ctx, normalizedRecords);

    console.log(`✨ Import complete: ${result.imported} imported, ${result.failed} failed`);

    return result;
  }
});

// ============================================================================
// CONVENIENCE MUTATIONS (One per source)
// ============================================================================

/**
 * Import NYS OAA food resources
 */
export const importNysOaa = internalMutation({
  args: {
    fileContent: v.string()
  },
  handler: async (ctx, { fileContent }) => {
    return await ctx.runMutation(api.ingestion.importResources.importResources, {
      source: "nys_oaa",
      data: fileContent,
      metadata: {
        license: "NYS Office for the Aging (OAA) data",
        fundingSource: "NYS Office for the Aging / Federal grants"
      }
    });
  }
});

/**
 * Import Eldercare Locator API response
 */
export const importEldercareLocator = internalMutation({
  args: {
    apiResponse: v.any()
  },
  handler: async (ctx, { apiResponse }) => {
    return await ctx.runMutation(api.ingestion.importResources.importResources, {
      source: "eldercare_locator",
      data: apiResponse,
      metadata: {
        license: "Public Domain (ACL/eldercare.acl.gov)",
        fundingSource: "Administration for Community Living (ACL)"
      }
    });
  }
});

/**
 * Import Open Referral (HSDS) data
 */
export const importOpenReferral = internalMutation({
  args: {
    services: v.any()
  },
  handler: async (ctx, { services }) => {
    return await ctx.runMutation(api.ingestion.importResources.importResources, {
      source: "open_referral",
      data: services,
      metadata: {
        license: "Varies by provider (check source)",
        fundingSource: "Multiple sources"
      }
    });
  }
});
