/**
 * Shared TypeScript types for give-care-etl pipeline
 *
 * These types match the IntermediateRecord contract from give-care-app
 * to ensure compatibility with the production ETL pipeline.
 */

// ============================================================================
// CORE RECORD TYPES (from give-care-app)
// ============================================================================

/**
 * IntermediateRecord - Contract for all external data sources
 *
 * This is the target format for the Extraction Agent.
 * Must match convex/ingestion/shared/types.ts in give-care-app.
 */
export interface IntermediateRecord {
  // REQUIRED FIELDS
  title: string;
  providerName: string;

  // CONTACT (at least one REQUIRED)
  phones?: string[];
  website?: string;
  email?: string;

  // CATEGORIZATION (REQUIRED)
  serviceTypes: string[]; // From SERVICE_TYPES constant
  zones: string[];        // From PRESSURE_ZONES constant

  // COVERAGE (REQUIRED)
  coverage: 'national' | 'state' | 'county' | 'zip' | 'radius';

  // OPTIONAL ENRICHMENT
  description?: string;
  eligibility?: string;
  languages?: string[];
  hours?: string;

  // LOCATION (optional, but recommended)
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;

  // METADATA (REQUIRED for traceability)
  dataSourceType: 'scraped' | 'manual_entry' | 'api';
  aggregatorSource: 'eldercare' | '211' | 'carelinq' | 'manual' | 'other';
  fundingSource?: 'federal' | 'state' | 'local' | 'nonprofit' | 'faith_based' | 'private';
  lastVerified?: string; // ISO 8601 date
  sourceUrl?: string;
  license?: string;
}

/**
 * DiscoveredSource - Output from Discovery Agent
 */
export interface DiscoveredSource {
  url: string;
  title: string;
  snippet: string;
  sourceType: 'government' | 'nonprofit' | 'state_agency' | 'local_agency' | 'aggregator' | 'other';
  credibilityScore: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  estimatedResourceCount?: number;
}

/**
 * CategorizedRecord - Output from Categorizer Agent
 */
export interface CategorizedRecord extends IntermediateRecord {
  zones: string[]; // Populated by Categorizer Agent
  categoryConfidence: number; // 0-100
}

/**
 * ValidatedRecord - Output from Validator Agent
 */
export interface ValidatedRecord extends CategorizedRecord {
  phoneE164?: string[]; // Normalized to E.164 format
  urlValid: boolean;
  urlRedirects?: string; // Final URL after redirects
  qualityScore: number; // 0-100
  validationErrors: string[];
  validationWarnings: string[];
  status: 'approved' | 'pending_review' | 'rejected';
}

/**
 * PendingResource - Awaiting human QA in dashboard
 */
export interface PendingResource extends ValidatedRecord {
  id: string;
  discoveredAt: string; // ISO 8601
  discoveredBy: string; // Discovery agent session ID
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

// ============================================================================
// AGENT CONTEXT TYPES
// ============================================================================

/**
 * OrchestratorContext - Shared state for orchestrator agent
 */
export interface OrchestratorContext {
  sessionId: string;
  task: string;
  state?: string; // US state code (e.g., "NY")
  limit?: number;
  sources: DiscoveredSource[];
  extractedRecords: IntermediateRecord[];
  categorizedRecords: CategorizedRecord[];
  validatedRecords: ValidatedRecord[];
  errors: string[];
  currentStep: 'discovery' | 'extraction' | 'categorization' | 'validation' | 'complete';
  startedAt: string;
  completedAt?: string;
}

/**
 * DiscoveryContext - Discovery agent state
 */
export interface DiscoveryContext {
  query: string;
  state?: string;
  limit?: number;
  sources: DiscoveredSource[];
  searchAttempts: number;
  errors: string[];
}

/**
 * ExtractionContext - Extraction agent state
 */
export interface ExtractionContext {
  url: string;
  sourceType: string;
  extractedData?: IntermediateRecord;
  retryCount: number;
  errors: string[];
}

/**
 * CategorizationContext - Categorizer agent state
 */
export interface CategorizationContext {
  record: IntermediateRecord;
  mappedZones: string[];
  confidence: number;
  errors: string[];
}

/**
 * ValidationContext - Validator agent state
 */
export interface ValidationContext {
  record: CategorizedRecord;
  phoneResults: Array<{ original: string; e164: string | null; valid: boolean }>;
  urlResult: { valid: boolean; statusCode?: number; redirectUrl?: string };
  qualityScore: number;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// AGENT HANDOFF TYPES
// ============================================================================

export interface AgentHandoff {
  from: string;
  to: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  handoff?: AgentHandoff;
}
