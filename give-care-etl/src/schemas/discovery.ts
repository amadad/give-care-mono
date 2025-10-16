/**
 * Zod schemas for Discovery Agent
 */

import { z } from 'zod';

// ============================================================================
// DISCOVERED SOURCE SCHEMA
// ============================================================================

export const DiscoveredSourceSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  snippet: z.string(),
  sourceType: z.enum(['government', 'nonprofit', 'state_agency', 'local_agency', 'aggregator', 'other']),
  credibilityScore: z.number().int().min(0).max(100),
  priority: z.enum(['high', 'medium', 'low']),
  estimatedResourceCount: z.number().int().min(0).optional()
});

export type DiscoveredSource = z.infer<typeof DiscoveredSourceSchema>;

// ============================================================================
// DISCOVERY RESULT SCHEMA
// ============================================================================

export const DiscoveryResultSchema = z.object({
  success: z.boolean(),
  query: z.string(),
  sources: z.array(DiscoveredSourceSchema),
  totalFound: z.number().int().min(0),
  searchAttempts: z.number().int().min(1),
  errors: z.array(z.string()).default([]),
  timestamp: z.string().datetime()
});

export type DiscoveryResult = z.infer<typeof DiscoveryResultSchema>;

// ============================================================================
// SEARCH QUERY SCHEMA
// ============================================================================

export const SearchQuerySchema = z.object({
  keywords: z.array(z.string()).min(1),
  state: z.string().length(2).optional(), // US state code
  filters: z.object({
    includeGovernment: z.boolean().default(true),
    includeNonprofits: z.boolean().default(true),
    includeAggregators: z.boolean().default(true),
    excludeDomains: z.array(z.string()).default([])
  }).optional(),
  limit: z.number().int().min(1).max(100).default(10)
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
