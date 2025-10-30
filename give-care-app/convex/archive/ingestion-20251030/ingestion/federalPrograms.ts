/**
 * Federal Caregiver Programs (Manual Seed Data)
 *
 * 15 verified federal programs mapped to 5 pressure zones.
 * Last verified: 2025-10-15
 *
 * Usage:
 * 1. Run `npx convex dev`
 * 2. Call importFederalPrograms from Convex dashboard
 * 3. Programs will be loaded into resource tables
 */

import { internalMutation } from '../_generated/server'
import { IntermediateRecord } from './shared/types'
import { normalizeRecord } from './shared/normalize'
import { loadNormalizedRecords } from './shared/load'

// ============================================================================
// STEP 1: EXTRACT - Manual federal program data
// ============================================================================

const FEDERAL_PROGRAMS: IntermediateRecord[] = [
  // EMOTIONAL WELLBEING (3)
  {
    title: '988 Suicide & Crisis Lifeline',
    description:
      '24/7 free and confidential support for people in distress, crisis resources, and prevention and crisis resources for you or your loved ones.',
    providerName: 'SAMHSA',
    phones: ['988'],
    website: 'https://988lifeline.org',
    serviceTypes: ['crisis_support', 'counseling'],
    zones: ['emotional_wellbeing'],
    coverage: 'national',
    eligibility: 'Open to all',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.samhsa.gov/find-help/988',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },
  {
    title: 'SAMHSA National Helpline',
    description:
      'Free, confidential, 24/7 treatment referral and information service for individuals and families facing mental health and/or substance use disorders.',
    providerName: 'SAMHSA',
    phones: ['1-800-662-4357'],
    website: 'https://www.samhsa.gov/find-help/national-helpline',
    serviceTypes: ['counseling', 'navigation'],
    zones: ['emotional_wellbeing'],
    coverage: 'national',
    eligibility: 'Open to all',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.samhsa.gov/find-help/national-helpline',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },
  {
    title: 'Disaster Distress Helpline',
    description:
      'Crisis counseling and support for people experiencing emotional distress related to disasters.',
    providerName: 'SAMHSA',
    phones: ['1-800-985-5990'],
    website: 'https://www.samhsa.gov/find-help/disaster-distress-helpline',
    serviceTypes: ['crisis_support', 'counseling'],
    zones: ['emotional_wellbeing'],
    coverage: 'national',
    eligibility: 'Open to all',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.samhsa.gov/find-help/disaster-distress-helpline',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },

  // PHYSICAL HEALTH (3)
  {
    title: 'Medicare Help',
    description:
      'Official U.S. government Medicare helpline for questions about coverage, enrollment, claims, and benefits.',
    providerName: 'Centers for Medicare & Medicaid Services',
    phones: ['1-800-633-4227'],
    website: 'https://www.medicare.gov/talk-to-someone',
    serviceTypes: ['navigation', 'financial_assistance'],
    zones: ['physical_health', 'financial_concerns'],
    coverage: 'national',
    eligibility: 'Age 65+, certain disabilities, or ESRD',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.medicare.gov',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },
  {
    title: 'Eldercare Locator',
    description:
      'Nationwide service connecting older adults and caregivers to local Area Agencies on Aging and community-based services.',
    providerName: 'Administration for Community Living',
    phones: ['1-800-677-1116'],
    website: 'https://eldercare.acl.gov',
    serviceTypes: ['navigation'],
    zones: ['social_support', 'time_management'],
    coverage: 'national',
    eligibility: 'Age 60+, caregivers of older adults',
    languages: ['en', 'es'],
    sourceUrl: 'https://eldercare.acl.gov',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },
  {
    title: 'VA Health Care',
    description:
      'Comprehensive health care services for eligible Veterans, including primary care, specialty care, mental health, and long-term care.',
    providerName: 'Veterans Health Administration',
    phones: ['1-877-222-8387'],
    website: 'https://www.va.gov/health-care',
    serviceTypes: ['navigation'],
    zones: ['physical_health'],
    coverage: 'national',
    eligibility: 'Veterans with qualifying service',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.va.gov/health',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },

  // FINANCIAL CONCERNS (3)
  {
    title: 'State Health Insurance Assistance Program (SHIP)',
    description:
      'Free, unbiased Medicare counseling and assistance in every state. Helps with enrollment, coverage decisions, and billing issues.',
    providerName: 'Administration for Community Living',
    phones: ['1-877-839-2675'],
    website: 'https://www.shiphelp.org',
    serviceTypes: ['navigation', 'financial_assistance'],
    zones: ['financial_concerns'],
    coverage: 'national',
    eligibility: 'Medicare beneficiaries and caregivers',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.shiphelp.org',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },
  {
    title: 'Social Security Administration',
    description:
      'Retirement, disability, and survivor benefits. Includes Medicare enrollment assistance and Supplemental Security Income (SSI).',
    providerName: 'Social Security Administration',
    phones: ['1-800-772-1213'],
    website: 'https://www.ssa.gov',
    serviceTypes: ['financial_assistance', 'navigation'],
    zones: ['financial_concerns'],
    coverage: 'national',
    eligibility: 'U.S. citizens and eligible non-citizens',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.ssa.gov',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },
  {
    title: 'Benefits.gov - Federal Benefits Finder',
    description:
      'Search for federal benefit programs including housing assistance, food assistance, disaster relief, and more.',
    providerName: 'U.S. General Services Administration',
    website: 'https://www.benefits.gov',
    serviceTypes: ['navigation', 'financial_assistance'],
    zones: ['financial_concerns'],
    coverage: 'national',
    eligibility: 'Varies by program',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.benefits.gov',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },

  // TIME MANAGEMENT (3)
  {
    title: 'ARCH National Respite Network',
    description:
      'Helps caregivers locate respite services in their state. Provides information on temporary relief care options.',
    providerName: 'ARCH National Respite Network and Resource Center',
    website: 'https://archrespite.org/respitelocator',
    serviceTypes: ['respite', 'navigation'],
    zones: ['time_management'],
    coverage: 'national',
    eligibility: 'Caregivers seeking temporary care support',
    languages: ['en'],
    sourceUrl: 'https://archrespite.org',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },
  {
    title: 'VA Caregiver Support Line',
    description:
      'Information, resources, and support for caregivers of Veterans. Includes respite care, training, and financial assistance programs.',
    providerName: 'Veterans Health Administration',
    phones: ['1-855-260-3274'],
    website: 'https://www.caregiver.va.gov',
    serviceTypes: ['caregiver_support', 'respite', 'financial_assistance'],
    zones: ['time_management', 'social_support'],
    coverage: 'national',
    eligibility: 'Caregivers of Veterans',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.caregiver.va.gov',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },
  {
    title: 'National Institute on Aging Information Center',
    description:
      "Evidence-based information on healthy aging, Alzheimer's disease, caregiving, and clinical trials.",
    providerName: 'National Institute on Aging',
    phones: ['1-800-222-2225'],
    website: 'https://www.nia.nih.gov/health',
    serviceTypes: ['navigation', 'education_training'],
    zones: ['time_management', 'physical_health'],
    coverage: 'national',
    eligibility: 'Open to all',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.nia.nih.gov',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'federal',
    lastVerified: '2025-10-15',
  },

  // SOCIAL SUPPORT (3)
  {
    title: "Alzheimer's Association 24/7 Helpline",
    description:
      'Free, confidential support and information for people living with dementia and their caregivers. Available 24/7.',
    providerName: "Alzheimer's Association",
    phones: ['1-800-272-3900'],
    website: 'https://www.alz.org/help-support/caregiving',
    serviceTypes: ['caregiver_support', 'counseling'],
    zones: ['social_support', 'emotional_wellbeing'],
    coverage: 'national',
    eligibility: 'Open to all',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.alz.org',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'nonprofit',
    lastVerified: '2025-10-15',
  },
  {
    title: 'Family Caregiver Alliance National Center on Caregiving',
    description:
      'Education, services, research, and advocacy for family caregivers. Includes fact sheets, online support groups, and policy information.',
    providerName: 'Family Caregiver Alliance',
    phones: ['1-800-445-8106'],
    website: 'https://www.caregiver.org',
    serviceTypes: ['caregiver_support', 'education_training'],
    zones: ['social_support', 'emotional_wellbeing'],
    coverage: 'national',
    eligibility: 'Family caregivers nationwide',
    languages: ['en', 'es'],
    sourceUrl: 'https://www.caregiver.org',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'nonprofit',
    lastVerified: '2025-10-15',
  },
  {
    title: 'Caregiver Action Network',
    description:
      "Nation's leading family caregiver organization. Provides education, peer support, and resources for caregivers.",
    providerName: 'Caregiver Action Network',
    phones: ['1-855-227-3640'],
    website: 'https://caregiveraction.org',
    serviceTypes: ['caregiver_support', 'navigation'],
    zones: ['social_support'],
    coverage: 'national',
    eligibility: 'Family caregivers nationwide',
    languages: ['en'],
    sourceUrl: 'https://caregiveraction.org',
    dataSourceType: 'manual_entry',
    aggregatorSource: 'manual',
    fundingSource: 'nonprofit',
    lastVerified: '2025-10-15',
  },
]

// ============================================================================
// STEP 2 & 3: TRANSFORM → LOAD (handled by shared pipeline)
// ============================================================================

export const importFederalPrograms = internalMutation({
  handler: async ctx => {
    console.log(`Starting import of ${FEDERAL_PROGRAMS.length} federal programs...`)

    // STEP 2: Transform IntermediateRecord → NormalizedRecord
    const normalized = FEDERAL_PROGRAMS.map(raw => normalizeRecord(raw))

    // STEP 3: Load into database
    const result = await loadNormalizedRecords(ctx, normalized)

    console.log(`Import complete: ${result.imported} imported, ${result.failed} failed`)

    return result
  },
})
