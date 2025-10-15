/**
 * Seed 5 essential national resources
 * Run in Convex dashboard or via CLI
 */

import { mutation } from "../_generated/server";

export const seedEssentialResources = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results = [];

    // Resource 1: National Caregiver Support Hotline
    const provider1 = await ctx.db.insert("providers", {
      name: "National Alliance for Caregiving",
      sector: "nonprofit",
      operatorUrl: "https://www.caregiving.org",
      license: "Manually curated - verified 2025-10-14",
      notes: "MVP essential resource - national hotline",
      createdAt: now,
      updatedAt: now
    });

    const program1 = await ctx.db.insert("programs", {
      providerId: provider1,
      name: "24/7 Caregiver Support Hotline",
      description: "Free confidential support for family caregivers. Connect with trained counselors 24/7.",
      resourceCategory: ["caregiver_support", "counseling"],
      pressureZones: ["emotional", "social"],
      fundingSource: "Private foundation",
      eligibility: "All family caregivers",
      languageSupport: ["en"],
      createdAt: now,
      updatedAt: now
    });

    const facility1 = await ctx.db.insert("facilities", {
      providerId: provider1,
      name: "National Alliance for Caregiving",
      phoneE164: "+18007998335",
      languages: ["en"],
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("serviceAreas", {
      programId: program1,
      type: "national",
      geoCodes: [],
      jurisdictionLevel: "national",
      createdAt: now,
      updatedAt: now
    });

    const resource1 = await ctx.db.insert("resources", {
      programId: program1,
      facilityId: facility1,
      dataSourceType: "manual_entry",
      verificationStatus: "verified_basic",
      lastVerifiedDate: now,
      scoreRbi: 85,
      successCount: 0,
      issueCount: 0,
      createdAt: now,
      updatedAt: now
    });

    results.push({ provider: provider1, program: program1, resource: resource1 });

    // Resource 2: Eldercare Locator (Respite)
    const provider2 = await ctx.db.insert("providers", {
      name: "Eldercare Locator (ACL)",
      sector: "public_federal",
      operatorUrl: "https://eldercare.acl.gov",
      license: "Public Domain (ACL)",
      notes: "MVP essential resource - respite finder",
      createdAt: now,
      updatedAt: now
    });

    const program2 = await ctx.db.insert("programs", {
      providerId: provider2,
      name: "Local Respite Care Finder",
      description: "Connects caregivers to local respite services. Find in-home care, adult day programs, and overnight facilities.",
      resourceCategory: ["respite"],
      pressureZones: ["physical", "temporal"],
      fundingSource: "Federal (ACL)",
      eligibility: "Caregivers of adults 60+",
      languageSupport: ["en", "es"],
      createdAt: now,
      updatedAt: now
    });

    const facility2 = await ctx.db.insert("facilities", {
      providerId: provider2,
      name: "Eldercare Locator",
      phoneE164: "+18006772116",
      languages: ["en", "es"],
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("serviceAreas", {
      programId: program2,
      type: "national",
      geoCodes: [],
      jurisdictionLevel: "national",
      createdAt: now,
      updatedAt: now
    });

    const resource2 = await ctx.db.insert("resources", {
      programId: program2,
      facilityId: facility2,
      primaryUrl: "https://eldercare.acl.gov",
      dataSourceType: "manual_entry",
      verificationStatus: "verified_full",
      lastVerifiedDate: now,
      scoreRbi: 95,
      successCount: 0,
      issueCount: 0,
      createdAt: now,
      updatedAt: now
    });

    results.push({ provider: provider2, program: program2, resource: resource2 });

    // Resource 3: AARP Caregiving Resources
    const provider3 = await ctx.db.insert("providers", {
      name: "AARP",
      sector: "nonprofit",
      operatorUrl: "https://www.aarp.org",
      license: "Manually curated - verified 2025-10-14",
      notes: "MVP essential resource - education",
      createdAt: now,
      updatedAt: now
    });

    const program3 = await ctx.db.insert("programs", {
      providerId: provider3,
      name: "Prepare to Care Planning Guide",
      description: "Free downloadable caregiving planning workbook. Helps organize medical info, legal documents, and care plans.",
      resourceCategory: ["education_training"],
      pressureZones: ["cognitive", "planning"],
      fundingSource: "AARP membership dues",
      eligibility: "All caregivers (no membership required)",
      languageSupport: ["en", "es"],
      createdAt: now,
      updatedAt: now
    });

    const facility3 = await ctx.db.insert("facilities", {
      providerId: provider3,
      name: "AARP",
      languages: ["en", "es"],
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("serviceAreas", {
      programId: program3,
      type: "national",
      geoCodes: [],
      jurisdictionLevel: "national",
      createdAt: now,
      updatedAt: now
    });

    const resource3 = await ctx.db.insert("resources", {
      programId: program3,
      facilityId: facility3,
      primaryUrl: "https://www.aarp.org/caregiving/prepare-to-care-planning-guide/",
      dataSourceType: "manual_entry",
      verificationStatus: "verified_full",
      lastVerifiedDate: now,
      scoreRbi: 90,
      successCount: 0,
      issueCount: 0,
      createdAt: now,
      updatedAt: now
    });

    results.push({ provider: provider3, program: program3, resource: resource3 });

    // Resource 4: BenefitsCheckUp (Financial)
    const provider4 = await ctx.db.insert("providers", {
      name: "National Council on Aging (NCOA)",
      sector: "nonprofit",
      operatorUrl: "https://www.ncoa.org",
      license: "Manually curated - verified 2025-10-14",
      notes: "MVP essential resource - financial screening",
      createdAt: now,
      updatedAt: now
    });

    const program4 = await ctx.db.insert("programs", {
      providerId: provider4,
      name: "BenefitsCheckUp",
      description: "Free screening tool to find financial assistance programs caregivers may qualify for. Covers healthcare, food, utilities, housing.",
      resourceCategory: ["financial_assistance", "navigation"],
      pressureZones: ["financial", "navigation"],
      fundingSource: "Private foundation",
      eligibility: "Age 55+ and caregivers",
      languageSupport: ["en", "es"],
      createdAt: now,
      updatedAt: now
    });

    const facility4 = await ctx.db.insert("facilities", {
      providerId: provider4,
      name: "NCOA",
      languages: ["en", "es"],
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("serviceAreas", {
      programId: program4,
      type: "national",
      geoCodes: [],
      jurisdictionLevel: "national",
      createdAt: now,
      updatedAt: now
    });

    const resource4 = await ctx.db.insert("resources", {
      programId: program4,
      facilityId: facility4,
      primaryUrl: "https://www.benefitscheckup.org",
      dataSourceType: "manual_entry",
      verificationStatus: "verified_full",
      lastVerifiedDate: now,
      scoreRbi: 88,
      successCount: 0,
      issueCount: 0,
      createdAt: now,
      updatedAt: now
    });

    results.push({ provider: provider4, program: program4, resource: resource4 });

    // Resource 5: Family Caregiver Alliance
    const provider5 = await ctx.db.insert("providers", {
      name: "Family Caregiver Alliance",
      sector: "nonprofit",
      operatorUrl: "https://www.caregiver.org",
      license: "Manually curated - verified 2025-10-14",
      notes: "MVP essential resource - comprehensive navigation",
      createdAt: now,
      updatedAt: now
    });

    const program5 = await ctx.db.insert("programs", {
      providerId: provider5,
      name: "Caregiver Resource Center",
      description: "Information, education, services, research, and advocacy for caregivers. State-by-state resource directory.",
      resourceCategory: ["navigation", "education_training"],
      pressureZones: ["cognitive", "emotional", "social"],
      fundingSource: "Private foundation + grants",
      eligibility: "All family caregivers",
      languageSupport: ["en", "es", "zh"],
      createdAt: now,
      updatedAt: now
    });

    const facility5 = await ctx.db.insert("facilities", {
      providerId: provider5,
      name: "Family Caregiver Alliance",
      phoneE164: "+18004457250",
      languages: ["en", "es", "zh"],
      createdAt: now,
      updatedAt: now
    });

    await ctx.db.insert("serviceAreas", {
      programId: program5,
      type: "national",
      geoCodes: [],
      jurisdictionLevel: "national",
      createdAt: now,
      updatedAt: now
    });

    const resource5 = await ctx.db.insert("resources", {
      programId: program5,
      facilityId: facility5,
      primaryUrl: "https://www.caregiver.org",
      dataSourceType: "manual_entry",
      verificationStatus: "verified_full",
      lastVerifiedDate: now,
      scoreRbi: 92,
      successCount: 0,
      issueCount: 0,
      createdAt: now,
      updatedAt: now
    });

    results.push({ provider: provider5, program: program5, resource: resource5 });

    return {
      success: true,
      message: `Seeded ${results.length} essential resources`,
      resources: results.map(r => ({
        providerId: r.provider,
        programId: r.program,
        resourceId: r.resource
      }))
    };
  }
});
