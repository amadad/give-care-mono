/**
 * Zod schemas for LLM-based extraction
 *
 * These schemas are used by llm-scraper-worker to extract structured
 * data from web pages. They match the IntermediateRecord contract.
 */

import { z } from 'zod';

// ============================================================================
// INTERMEDIATE RECORD SCHEMA (for llm-scraper-worker)
// ============================================================================

/**
 * Zod schema for IntermediateRecord extraction
 *
 * This schema is passed to llm-scraper-worker to extract structured
 * resource data from web pages.
 */
export const IntermediateRecordSchema = z.object({
  // REQUIRED FIELDS
  title: z.string().min(1, 'Title is required'),
  providerName: z.string().min(1, 'Provider name is required'),

  // CONTACT (at least one REQUIRED - validated separately)
  phones: z.array(z.string()).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),

  // CATEGORIZATION (REQUIRED)
  serviceTypes: z.array(z.enum([
    'respite',
    'support_group',
    'counseling',
    'crisis_support',
    'financial_aid',
    'medicare_help',
    'legal_planning',
    'navigation',
    'equipment_devices',
    'education_training',
    'caregiver_support'
  ])).min(1, 'At least one service type required'),

  // COVERAGE (REQUIRED)
  coverage: z.enum(['national', 'state', 'county', 'zip', 'radius']),

  // OPTIONAL ENRICHMENT
  description: z.string().optional(),
  eligibility: z.string().optional(),
  languages: z.array(z.string()).optional(),
  hours: z.string().optional(),

  // LOCATION (optional)
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(), // US state code
  zip: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional()
}).refine(
  (data) => data.phones && data.phones.length > 0 || data.website || data.email,
  {
    message: 'At least one contact method (phone, website, or email) is required',
    path: ['phones']
  }
);

export type IntermediateRecordInput = z.infer<typeof IntermediateRecordSchema>;

// ============================================================================
// SIMPLIFIED EXTRACTION SCHEMA (for initial scraping)
// ============================================================================

/**
 * Simplified schema for initial extraction pass.
 * Categorizer agent will populate zones and serviceTypes later.
 */
export const SimpleExtractionSchema = z.object({
  title: z.string(),
  providerName: z.string(),
  description: z.string().optional(),
  phones: z.array(z.string()).optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  eligibility: z.string().optional(),
  hours: z.string().optional()
});

export type SimpleExtraction = z.infer<typeof SimpleExtractionSchema>;

// ============================================================================
// EXTRACTION RESULT SCHEMA
// ============================================================================

/**
 * Result returned by Extraction Agent
 */
export const ExtractionResultSchema = z.object({
  success: z.boolean(),
  data: IntermediateRecordSchema.optional(),
  error: z.string().optional(),
  sourceUrl: z.string().url(),
  scrapedAt: z.string().datetime(),
  retryCount: z.number().int().min(0)
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
