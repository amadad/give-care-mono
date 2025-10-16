/**
 * Shared types for the ETL pipeline
 *
 * All source adapters output this intermediate format,
 * which is then processed by shared transform/load functions.
 *
 * PRODUCTION CONTRACT (locked 2025-10-15)
 */

/**
 * Intermediate format after parsing (before normalization)
 *
 * REQUIRED: title, providerName, at least one of (phones|website), at least one of (serviceTypes|zones)
 */
export interface IntermediateRecord {
  // Program details (REQUIRED)
  title: string;
  description?: string;

  // Provider details (REQUIRED)
  providerName: string;

  // Contact (at least one REQUIRED)
  phones?: string[]; // Raw format; will be normalized to E.164
  website?: string;
  email?: string;

  // Location (optional but recommended)
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;

  // Categorization (at least one REQUIRED)
  serviceTypes: string[]; // ['respite', 'support_group', 'financial_aid', ...]
  zones: string[]; // ['emotional_wellbeing', 'time_management', ...]

  // Coverage (REQUIRED)
  coverage: 'national' | 'state' | 'county' | 'zip' | 'radius';

  // Service details
  hours?: string;
  eligibility?: string;
  languages?: string[];

  // Metadata (REQUIRED)
  sourceUrl?: string; // URL where this was found
  license?: string;
  dataSourceType: 'scraped' | 'manual_entry' | 'api';
  aggregatorSource: 'eldercare' | '211' | 'carelinq' | 'manual' | 'other';
  fundingSource?: 'federal' | 'state' | 'nonprofit' | 'private';
  lastVerified?: string; // ISO date string
}

/**
 * After normalization and categorization
 */
export interface NormalizedRecord {
  // Program
  program: {
    name: string;
    description: string;
    resourceCategory: string[];
    pressureZones: string[];
    eligibility: string;
    languageSupport: string[];
    fundingSource?: string;
  };

  // Provider
  provider: {
    name: string;
    sector: string;
    operatorUrl?: string;
    license?: string;
    notes?: string;
  };

  // Facility
  facility: {
    name: string;
    phoneE164?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    geo?: { lat: number; lon: number };
    hours?: string;
    languages: string[];
  };

  // Service Area
  serviceArea: {
    type: "county" | "city" | "zip_cluster" | "statewide" | "national";
    geoCodes: string[];
    jurisdictionLevel: string;
  };

  // Metadata
  metadata: {
    dataSourceType: string;
    aggregatorSource: string;
    externalId?: string;
    externalUrl?: string;
  };
}
