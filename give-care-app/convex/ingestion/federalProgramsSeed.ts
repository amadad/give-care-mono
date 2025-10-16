/**
 * Federal Caregiver Programs - Production Seed Data
 *
 * 15 verified federal programs mapped to 5 pressure zones
 * Last verified: 2025-10-15
 *
 * PRODUCTION CONTRACT: All fields match IntermediateRecord requirements
 */

import { internalMutation } from "../_generated/server";
import type { IntermediateRecord } from "./shared/types";
import { normalizeRecord } from "./shared/normalize";
import { loadNormalizedRecords } from "./shared/load";

const FEDERAL_PROGRAMS: IntermediateRecord[] = [
  // EMOTIONAL WELLBEING (3)
  {
    title: "988 Suicide & Crisis Lifeline",
    description: "24/7 free and confidential support for people in distress. Trained crisis counselors available to help with emotional distress, suicide prevention, and mental health crises.",
    providerName: "SAMHSA",
    phones: ["988", "1-800-273-8255"],
    website: "https://988lifeline.org",
    serviceTypes: ["crisis_support", "counseling"],
    zones: ["emotional_wellbeing"],
    coverage: "national",
    eligibility: "Open to all",
    languages: ["en", "es"],
    sourceUrl: "https://www.samhsa.gov/find-help/988",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },
  {
    title: "SAMHSA National Helpline",
    description: "Free, confidential, 24/7 treatment referral and information service for individuals and families facing mental health and/or substance use disorders.",
    providerName: "SAMHSA",
    phones: ["1-800-662-4357"],
    website: "https://www.samhsa.gov/find-help/national-helpline",
    serviceTypes: ["counseling", "navigation"],
    zones: ["emotional_wellbeing"],
    coverage: "national",
    eligibility: "Open to all",
    languages: ["en", "es"],
    sourceUrl: "https://www.samhsa.gov/find-help/national-helpline",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },
  {
    title: "Disaster Distress Helpline",
    description: "24/7 crisis counseling and emotional support for people experiencing distress related to natural or human-caused disasters.",
    providerName: "SAMHSA",
    phones: ["1-800-985-5990"],
    website: "https://www.samhsa.gov/find-help/disaster-distress-helpline",
    serviceTypes: ["crisis_support", "counseling"],
    zones: ["emotional_wellbeing"],
    coverage: "national",
    eligibility: "Open to all",
    languages: ["en", "es"],
    sourceUrl: "https://www.samhsa.gov/find-help/disaster-distress-helpline",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },

  // PHYSICAL HEALTH (3)
  {
    title: "Medicare Help",
    description: "Official U.S. government Medicare helpline for questions about coverage, enrollment, claims, and benefits. Speak with licensed agents.",
    providerName: "Centers for Medicare & Medicaid Services",
    phones: ["1-800-633-4227"],
    website: "https://www.medicare.gov/talk-to-someone",
    serviceTypes: ["medicare_help", "navigation"],
    zones: ["physical_health", "financial_concerns"],
    coverage: "national",
    eligibility: "Age 65+, certain disabilities, or ESRD",
    languages: ["en", "es"],
    sourceUrl: "https://www.medicare.gov",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },
  {
    title: "Eldercare Locator",
    description: "Nationwide service connecting older adults and caregivers to local Area Agencies on Aging and community-based services like transportation, meals, home care, and caregiver support.",
    providerName: "Administration for Community Living",
    phones: ["1-800-677-1116"],
    website: "https://eldercare.acl.gov",
    serviceTypes: ["navigation", "caregiver_support"],
    zones: ["physical_health", "social_support", "time_management"],
    coverage: "national",
    eligibility: "Age 60+, caregivers of older adults",
    languages: ["en", "es"],
    sourceUrl: "https://eldercare.acl.gov",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },
  {
    title: "VA Health Care",
    description: "Comprehensive health care services for eligible Veterans including primary care, specialty care, mental health services, and long-term care. Caregiver support programs available.",
    providerName: "Veterans Health Administration",
    phones: ["1-877-222-8387"],
    website: "https://www.va.gov/health-care",
    serviceTypes: ["navigation", "caregiver_support"],
    zones: ["physical_health"],
    coverage: "national",
    eligibility: "Veterans with qualifying service",
    languages: ["en", "es"],
    sourceUrl: "https://www.va.gov/health-care",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },

  // FINANCIAL CONCERNS (3)
  {
    title: "State Health Insurance Assistance Program (SHIP)",
    description: "Free, unbiased Medicare counseling and assistance in every state. Helps with enrollment decisions, understanding coverage options, and resolving billing issues.",
    providerName: "Administration for Community Living",
    phones: ["1-877-839-2675"],
    website: "https://www.shiphelp.org",
    serviceTypes: ["medicare_help", "navigation"],
    zones: ["financial_concerns"],
    coverage: "national",
    eligibility: "Medicare beneficiaries and caregivers",
    languages: ["en", "es"],
    sourceUrl: "https://www.shiphelp.org",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },
  {
    title: "Social Security Administration",
    description: "Retirement, disability, and survivor benefits. Includes Medicare enrollment assistance and Supplemental Security Income (SSI) for people with limited income.",
    providerName: "Social Security Administration",
    phones: ["1-800-772-1213"],
    website: "https://www.ssa.gov",
    serviceTypes: ["financial_aid", "navigation"],
    zones: ["financial_concerns"],
    coverage: "national",
    eligibility: "U.S. citizens and eligible non-citizens",
    languages: ["en", "es"],
    sourceUrl: "https://www.ssa.gov",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },
  {
    title: "Benefits.gov Federal Benefits Finder",
    description: "Search tool for federal benefit programs including housing assistance, food programs, disaster relief, grants, and more. Over 1,000 programs searchable by category.",
    providerName: "U.S. General Services Administration",
    phones: [],
    website: "https://www.benefits.gov",
    serviceTypes: ["financial_aid", "navigation"],
    zones: ["financial_concerns"],
    coverage: "national",
    eligibility: "Varies by program",
    languages: ["en", "es"],
    sourceUrl: "https://www.benefits.gov",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },

  // TIME MANAGEMENT (3)
  {
    title: "ARCH National Respite Network",
    description: "Helps caregivers locate respite services by state. Provides information on temporary relief care options including in-home, adult day, and overnight respite.",
    providerName: "ARCH National Respite Network and Resource Center",
    phones: ["1-703-256-2084"],
    website: "https://archrespite.org/respitelocator",
    serviceTypes: ["respite", "navigation"],
    zones: ["time_management", "physical_health"],
    coverage: "national",
    eligibility: "Caregivers seeking temporary care support",
    languages: ["en"],
    sourceUrl: "https://archrespite.org",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },
  {
    title: "VA Caregiver Support Line",
    description: "Information, resources, and support for caregivers of Veterans. Programs include respite care, caregiver training, financial assistance (stipends for qualifying caregivers), and peer support.",
    providerName: "Veterans Health Administration",
    phones: ["1-855-260-3274"],
    website: "https://www.caregiver.va.gov",
    serviceTypes: ["caregiver_support", "respite", "financial_aid"],
    zones: ["time_management", "social_support", "financial_concerns"],
    coverage: "national",
    eligibility: "Caregivers of Veterans",
    languages: ["en", "es"],
    sourceUrl: "https://www.caregiver.va.gov",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },
  {
    title: "National Institute on Aging Information Center",
    description: "Evidence-based information on healthy aging, Alzheimer's disease and related dementias, caregiving strategies, and clinical trials. Free publications and fact sheets.",
    providerName: "National Institute on Aging",
    phones: ["1-800-222-2225"],
    website: "https://www.nia.nih.gov/health",
    serviceTypes: ["education_training", "navigation"],
    zones: ["time_management", "emotional_wellbeing"],
    coverage: "national",
    eligibility: "Open to all",
    languages: ["en", "es"],
    sourceUrl: "https://www.nia.nih.gov",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "federal",
    lastVerified: "2025-10-15"
  },

  // SOCIAL SUPPORT (3)
  {
    title: "Alzheimer's Association 24/7 Helpline",
    description: "Free, confidential support and information for people living with Alzheimer's and other dementias, and their caregivers. Dementia specialists available 24/7. Translation services for 200+ languages.",
    providerName: "Alzheimer's Association",
    phones: ["1-800-272-3900"],
    website: "https://www.alz.org/help-support/caregiving",
    serviceTypes: ["support_group", "counseling", "education_training"],
    zones: ["social_support", "emotional_wellbeing"],
    coverage: "national",
    eligibility: "Open to all",
    languages: ["en", "es"],
    sourceUrl: "https://www.alz.org",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "nonprofit",
    lastVerified: "2025-10-15"
  },
  {
    title: "Family Caregiver Alliance National Center on Caregiving",
    description: "Education, services, research, and advocacy for family caregivers. Includes fact sheets, online support groups, policy information, and state-by-state resource guides.",
    providerName: "Family Caregiver Alliance",
    phones: ["1-800-445-8106"],
    website: "https://www.caregiver.org",
    serviceTypes: ["caregiver_support", "education_training", "navigation"],
    zones: ["social_support", "emotional_wellbeing"],
    coverage: "national",
    eligibility: "Family caregivers nationwide",
    languages: ["en", "es"],
    sourceUrl: "https://www.caregiver.org",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "nonprofit",
    lastVerified: "2025-10-15"
  },
  {
    title: "Caregiver Action Network",
    description: "Nation's leading family caregiver organization. Provides peer support programs, education webinars, advocacy tools, and resources for family caregivers across all ages and conditions.",
    providerName: "Caregiver Action Network",
    phones: ["1-855-227-3640"],
    website: "https://caregiveraction.org",
    serviceTypes: ["caregiver_support", "education_training"],
    zones: ["social_support"],
    coverage: "national",
    eligibility: "Family caregivers nationwide",
    languages: ["en"],
    sourceUrl: "https://caregiveraction.org",
    license: "Public Domain (U.S. Government)",
    dataSourceType: "manual_entry",
    aggregatorSource: "manual",
    fundingSource: "nonprofit",
    lastVerified: "2025-10-15"
  }
];

/**
 * Import federal programs into resource database
 *
 * PRODUCTION-SAFE:
 * - Validates all records before import
 * - Returns detailed error report for any failures
 * - Idempotent (safe to run multiple times)
 */
export const importFederalPrograms = internalMutation({
  handler: async (ctx) => {
    console.log(`[IMPORT] Starting import of ${FEDERAL_PROGRAMS.length} federal programs...`);

    // STEP 1: Normalize all records (with validation)
    const normalizedResults: { record?: any; error?: string; title: string }[] = [];

    for (const raw of FEDERAL_PROGRAMS) {
      try {
        const normalized = normalizeRecord(raw);
        normalizedResults.push({ record: normalized, title: raw.title });
      } catch (error) {
        console.error(`[IMPORT] Failed to normalize ${raw.title}:`, error);
        normalizedResults.push({
          error: String(error),
          title: raw.title
        });
      }
    }

    const validRecords = normalizedResults
      .filter(r => r.record)
      .map(r => r.record!);

    const failedNormalization = normalizedResults.filter(r => r.error);

    console.log(`[IMPORT] Normalized ${validRecords.length} records, ${failedNormalization.length} failed validation`);

    // STEP 2: Load into database
    const loadResult = await loadNormalizedRecords(ctx, validRecords);

    // STEP 3: Return detailed report
    return {
      total: FEDERAL_PROGRAMS.length,
      normalized: validRecords.length,
      imported: loadResult.imported,
      failed: loadResult.failed + failedNormalization.length,
      normalizationErrors: failedNormalization.map(r => ({
        title: r.title,
        error: r.error
      })),
      loadErrors: loadResult.details.filter(d => d.error),
      success: loadResult.details.filter(d => !d.error)
    };
  }
});
