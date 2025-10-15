/**
 * Shared database loader (used by ALL source adapters)
 *
 * Handles:
 * - Deduplication (check if provider exists)
 * - Graph construction (provider → program → facility → serviceArea → resource)
 * - Error handling
 */

import { NormalizedRecord } from "./types";

export async function loadNormalizedRecord(
  ctx: any,
  record: NormalizedRecord
): Promise<{
  providerId: string;
  facilityId: string;
  programId: string;
  resourceId: string;
}> {
  const now = Date.now();

  // 1. Check if provider already exists (deduplication)
  const existingProvider = await ctx.db
    .query("providers")
    .withIndex("by_name", (q: any) => q.eq("name", record.provider.name))
    .first();

  let providerId;
  if (existingProvider) {
    providerId = existingProvider._id;
    console.log(`Provider exists: ${record.provider.name}`);
  } else {
    // Create provider
    providerId = await ctx.db.insert("providers", {
      name: record.provider.name,
      sector: record.provider.sector,
      operatorUrl: record.provider.operatorUrl || undefined,
      notes: record.provider.notes || undefined,
      license: record.provider.license || undefined,
      tosAllowsScrape: undefined,
      robotsAllowed: undefined,
      lastCrawledAt: undefined,
      createdAt: now,
      updatedAt: now
    });
    console.log(`Created provider: ${record.provider.name}`);
  }

  // 2. Create facility
  const facilityId = await ctx.db.insert("facilities", {
    providerId,
    name: record.facility.name,
    phoneE164: record.facility.phoneE164 || undefined,
    email: record.facility.email || undefined,
    address: record.facility.address || undefined,
    zip: record.facility.zip || undefined,
    geo: record.facility.geo || undefined,
    hours: record.facility.hours || undefined,
    languages: record.facility.languages,
    createdAt: now,
    updatedAt: now
  });

  // 3. Create program
  const programId = await ctx.db.insert("programs", {
    providerId,
    name: record.program.name,
    description: record.program.description || undefined,
    resourceCategory: record.program.resourceCategory,
    pressureZones: record.program.pressureZones,
    fundingSource: record.program.fundingSource || undefined,
    eligibility: record.program.eligibility || undefined,
    languageSupport: record.program.languageSupport,
    createdAt: now,
    updatedAt: now
  });

  // 4. Create service area
  await ctx.db.insert("serviceAreas", {
    programId,
    type: record.serviceArea.type,
    geoCodes: record.serviceArea.geoCodes,
    jurisdictionLevel: record.serviceArea.jurisdictionLevel || undefined,
    createdAt: now,
    updatedAt: now
  });

  // 5. Create resource (join all together)
  const resourceId = await ctx.db.insert("resources", {
    programId,
    facilityId,
    primaryUrl: record.provider.operatorUrl || undefined,
    dataSourceType: record.metadata.dataSourceType,
    aggregatorSource: record.metadata.aggregatorSource,
    verificationStatus: "unverified",
    jurisdictionLevel: record.serviceArea.jurisdictionLevel || undefined,
    license: record.provider.license,
    lastCrawledAt: now,
    scoreRbi: undefined,
    tosAllowsScrape: undefined,
    robotsAllowed: undefined,
    brokenLink: undefined,
    bounceCount: undefined,
    successCount: undefined,
    issueCount: undefined,
    lastFeedbackAt: undefined,
    notes: undefined,
    createdAt: now,
    updatedAt: now
  });

  return { providerId, facilityId, programId, resourceId };
}

/**
 * Batch load multiple records (more efficient)
 */
export async function loadNormalizedRecords(
  ctx: any,
  records: NormalizedRecord[]
): Promise<{
  imported: number;
  failed: number;
  details: Array<{
    provider: string;
    program: string;
    error?: string;
    providerId?: string;
    resourceId?: string;
  }>;
}> {
  const results = [];

  for (const record of records) {
    try {
      const ids = await loadNormalizedRecord(ctx, record);

      results.push({
        provider: record.provider.name,
        program: record.program.name,
        providerId: ids.providerId,
        resourceId: ids.resourceId
      });
    } catch (error) {
      console.error(`Failed to load ${record.program.name}:`, error);
      results.push({
        provider: record.provider.name,
        program: record.program.name,
        error: String(error)
      });
    }
  }

  return {
    imported: results.filter(r => !r.error).length,
    failed: results.filter(r => r.error).length,
    details: results
  };
}
