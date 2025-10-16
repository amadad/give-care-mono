/**
 * Zod schemas for Categorizer Agent
 */

import { z } from 'zod';

// ============================================================================
// CATEGORIZATION INPUT SCHEMA
// ============================================================================

export const CategorizationInputSchema = z.object({
  title: z.string(),
  providerName: z.string(),
  description: z.string().optional(),
  serviceTypes: z.array(z.string()).min(1),
  existingZones: z.array(z.string()).default([])
});

export type CategorizationInput = z.infer<typeof CategorizationInputSchema>;

// ============================================================================
// CATEGORIZATION OUTPUT SCHEMA
// ============================================================================

export const CategorizationOutputSchema = z.object({
  zones: z.array(z.enum([
    'physical_health',
    'emotional_wellbeing',
    'financial_concerns',
    'time_management',
    'social_support'
  ])).min(1),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().optional()
});

export type CategorizationOutput = z.infer<typeof CategorizationOutputSchema>;

// ============================================================================
// CATEGORIZATION RESULT SCHEMA
// ============================================================================

export const CategorizationResultSchema = z.object({
  success: z.boolean(),
  input: CategorizationInputSchema,
  output: CategorizationOutputSchema.optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime()
});

export type CategorizationResult = z.infer<typeof CategorizationResultSchema>;
