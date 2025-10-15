/**
 * Shared types for the ETL pipeline
 *
 * All source adapters output this intermediate format,
 * which is then processed by shared transform/load functions.
 */

/**
 * Intermediate format after parsing (before normalization)
 */
export interface IntermediateRecord {
  // Program details
  title: string;
  description: string;

  // Provider details
  providerName: string;
  providerUrl?: string;

  // Location
  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  // Contact
  phone?: string;
  email?: string;
  website?: string;

  // Service details
  hours?: string;
  eligibility?: string;
  languages?: string[];

  // Metadata
  sourceId?: string; // External ID from source system
  sourceUrl?: string; // URL where this was found
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
