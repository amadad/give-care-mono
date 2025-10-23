/**
 * Convex Client Utility for ETL Pipeline
 *
 * Allows Cloudflare Workers to call Convex mutations for persisting workflow state
 *
 * Updated for 3-agent architecture (v0.3.0):
 * - Removed categorizedCount (categorization now part of extraction)
 */

import { ConvexHttpClient } from "convex/browser";
import type { api as API } from "../../../give-care-app/convex/_generated/api";

type Api = typeof API;

/**
 * Create a Convex client for the ETL pipeline
 */
export function createConvexClient(convexUrl: string): ConvexHttpClient {
  return new ConvexHttpClient(convexUrl);
}

/**
 * Type-safe wrapper for calling Convex mutations from ETL
 */
export class ETLConvexClient {
  private client: ConvexHttpClient;

  constructor(convexUrl: string) {
    this.client = new ConvexHttpClient(convexUrl);
  }

  /**
   * Create a new workflow in Convex
   */
  async createWorkflow(args: {
    sessionId: string;
    task: string;
    state?: string;
    limit?: number;
    trigger?: string;
  }): Promise<{ workflowId: string }> {
    return this.client.mutation(
      "etl:createWorkflow" as any,
      args
    );
  }

  /**
   * Update workflow progress
   * Note: categorizedCount removed in v0.3.0 (categorization now part of extraction)
   */
  async updateWorkflow(args: {
    sessionId: string;
    currentStep?: string;
    status?: string;
    sourcesCount?: number;
    extractedCount?: number;
    validatedCount?: number;
    errorCount?: number;
    errors?: string[];
  }): Promise<{ success: boolean }> {
    return this.client.mutation(
      "etl:updateWorkflow" as any,
      args
    );
  }

  /**
   * Add discovered source
   */
  async addSource(args: {
    sessionId: string;
    url: string;
    title: string;
    description?: string;
    sourceType: string;
    trustScore: number;
  }): Promise<{ sourceId: string }> {
    return this.client.mutation(
      "etl:addSource" as any,
      args
    );
  }

  /**
   * Add extracted record
   */
  async addExtractedRecord(args: {
    sessionId: string;
    sourceId: string;
    title: string;
    providerName: string;
    phones: string[];
    website: string;
    serviceTypes: string[];
    coverage: string;
    state?: string;
    county?: string;
    zipCodes?: string[];
    description?: string;
    eligibility?: string;
    cost?: string;
  }): Promise<{ recordId: string }> {
    return this.client.mutation(
      "etl:addExtractedRecord" as any,
      args
    );
  }

  /**
   * Add validated record
   */
  async addValidatedRecord(args: {
    sessionId: string;
    extractedRecordId: string;
    title: string;
    providerName: string;
    phones: string[];
    website: string;
    serviceTypes: string[];
    zones: string[];
    coverage: string;
    state?: string;
    county?: string;
    zipCodes?: string[];
    description?: string;
    eligibility?: string;
    cost?: string;
    qualityScore: number;
    phoneValidation: {
      valid: boolean;
      normalized: string[];
    };
    urlValidation: {
      valid: boolean;
      statusCode?: number;
    };
  }): Promise<{ recordId: string }> {
    return this.client.mutation(
      "etl:addValidatedRecord" as any,
      args
    );
  }
}
