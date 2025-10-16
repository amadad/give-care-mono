/**
 * Zod schemas for Validator Agent
 */

import { z } from 'zod';

// ============================================================================
// PHONE VALIDATION RESULT SCHEMA
// ============================================================================

export const PhoneValidationResultSchema = z.object({
  original: z.string(),
  e164: z.string().nullable(),
  valid: z.boolean(),
  error: z.string().optional()
});

export type PhoneValidationResult = z.infer<typeof PhoneValidationResultSchema>;

// ============================================================================
// URL VALIDATION RESULT SCHEMA
// ============================================================================

export const UrlValidationResultSchema = z.object({
  original: z.string(),
  valid: z.boolean(),
  statusCode: z.number().int().optional(),
  redirectUrl: z.string().url().optional(),
  sslValid: z.boolean().optional(),
  error: z.string().optional()
});

export type UrlValidationResult = z.infer<typeof UrlValidationResultSchema>;

// ============================================================================
// QUALITY SCORE BREAKDOWN SCHEMA
// ============================================================================

export const QualityScoreBreakdownSchema = z.object({
  contactInfo: z.number().min(0).max(40), // Phone + website
  sourceCredibility: z.number().min(0).max(20), // Gov/nonprofit
  contactDiversity: z.number().min(0).max(15), // Multiple methods
  addressComplete: z.number().min(0).max(15), // Full address
  freshness: z.number().min(0).max(10), // Recent verification
  total: z.number().min(0).max(100)
});

export type QualityScoreBreakdown = z.infer<typeof QualityScoreBreakdownSchema>;

// ============================================================================
// VALIDATION RESULT SCHEMA
// ============================================================================

export const ValidationResultSchema = z.object({
  success: z.boolean(),
  phoneResults: z.array(PhoneValidationResultSchema),
  urlResult: UrlValidationResultSchema.optional(),
  qualityScore: z.number().int().min(0).max(100),
  qualityBreakdown: QualityScoreBreakdownSchema,
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  status: z.enum(['approved', 'pending_review', 'rejected']),
  timestamp: z.string().datetime()
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;
