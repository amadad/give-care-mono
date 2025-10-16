"use node";

/**
 * Complete ETL Pipeline Execution
 *
 * Orchestrates all 4 agents: Discovery → Extraction → Categorizer → Validator
 */

import { discoverSources } from "./discovery.simple";
import { extractResourceFromUrl } from "./extraction.simple";
import { categorizeRecord } from "./categorizer.simple";
import { validateRecord } from "./validator.simple";
import { ETLConvexClient } from "../utils/convex";
import { createLogger } from "../utils/logger";
import type { IntermediateRecord, CategorizedRecord, ValidatedRecord } from "../shared/types";

const logger = createLogger({ agentName: "pipeline" });

export interface PipelineConfig {
  sessionId: string;
  task: string;
  state?: string;
  limit?: number;
  openaiApiKey: string;
  convexUrl: string;
}

export interface PipelineResult {
  sessionId: string;
  sourcesFound: number;
  recordsExtracted: number;
  recordsCategorized: number;
  recordsValidated: number;
  errors: string[];
  duration: number;
}

/**
 * Execute complete ETL pipeline
 */
export async function executePipeline(config: PipelineConfig): Promise<PipelineResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const convex = new ETLConvexClient(config.convexUrl);

  logger.info("Starting pipeline", { sessionId: config.sessionId, task: config.task });

  try {
    // STEP 1: DISCOVERY
    logger.info("Step 1: Discovery", { sessionId: config.sessionId });
    await convex.updateWorkflow({
      sessionId: config.sessionId,
      currentStep: "discovery",
      status: "running"
    });

    const sources = await discoverSources(config.state, config.limit);
    logger.info("Discovery complete", { sessionId: config.sessionId, sourcesFound: sources.length });

    // Save sources to Convex
    for (const source of sources) {
      try {
        await convex.addSource({
          sessionId: config.sessionId,
          url: source.url,
          title: source.title,
          description: source.snippet,
          sourceType: source.sourceType,
          trustScore: source.credibilityScore / 10 // Convert 0-100 to 0-10
        });
      } catch (error) {
        logger.error("Failed to save source", { url: source.url, error });
        errors.push(`Failed to save source: ${source.url}`);
      }
    }

    // STEP 2: EXTRACTION
    logger.info("Step 2: Extraction", { sessionId: config.sessionId });
    await convex.updateWorkflow({
      sessionId: config.sessionId,
      currentStep: "extraction",
      sourcesCount: sources.length
    });

    const extractedRecords: IntermediateRecord[] = [];

    // Extract from first 3 sources for testing (to avoid timeout)
    for (const source of sources.slice(0, 3)) {
      try {
        logger.info("Extracting from source", { url: source.url });
        const record = await extractResourceFromUrl(source.url, config.openaiApiKey);

        if (record) {
          extractedRecords.push(record);
          // Note: We'll save to Convex after categorization
        } else {
          errors.push(`Failed to extract from: ${source.url}`);
        }
      } catch (error) {
        logger.error("Extraction error", { url: source.url, error });
        errors.push(`Extraction error: ${source.url}`);
      }
    }

    logger.info("Extraction complete", {
      sessionId: config.sessionId,
      recordsExtracted: extractedRecords.length
    });

    await convex.updateWorkflow({
      sessionId: config.sessionId,
      extractedCount: extractedRecords.length
    });

    // STEP 3: CATEGORIZATION
    logger.info("Step 3: Categorization", { sessionId: config.sessionId });
    await convex.updateWorkflow({
      sessionId: config.sessionId,
      currentStep: "categorization"
    });

    const categorizedRecords: CategorizedRecord[] = [];

    for (const record of extractedRecords) {
      try {
        const categorized = categorizeRecord(record);
        categorizedRecords.push(categorized);
      } catch (error) {
        logger.error("Categorization error", { title: record.title, error });
        errors.push(`Categorization error: ${record.title}`);
      }
    }

    logger.info("Categorization complete", {
      sessionId: config.sessionId,
      recordsCategorized: categorizedRecords.length
    });

    await convex.updateWorkflow({
      sessionId: config.sessionId,
      categorizedCount: categorizedRecords.length
    });

    // STEP 4: VALIDATION
    logger.info("Step 4: Validation", { sessionId: config.sessionId });
    await convex.updateWorkflow({
      sessionId: config.sessionId,
      currentStep: "validation"
    });

    const validatedRecords: ValidatedRecord[] = [];

    for (const record of categorizedRecords) {
      try {
        const validated = await validateRecord(record);
        validatedRecords.push(validated);

        // Save to Convex
        await convex.addValidatedRecord({
          sessionId: config.sessionId,
          extractedRecordId: "temp", // TODO: Get actual ID
          title: validated.title,
          providerName: validated.providerName,
          phones: validated.phoneE164 || validated.phones || [],
          website: validated.website || "",
          serviceTypes: validated.serviceTypes,
          zones: validated.zones,
          coverage: validated.coverage,
          state: validated.state,
          county: validated.county,
          zipCodes: validated.zip ? [validated.zip] : undefined,
          description: validated.description,
          eligibility: validated.eligibility,
          cost: undefined,
          qualityScore: validated.qualityScore / 10, // Convert 0-100 to 0-10
          phoneValidation: {
            valid: validated.phoneE164 !== undefined && validated.phoneE164.length > 0,
            normalized: validated.phoneE164 || []
          },
          urlValidation: {
            valid: validated.urlValid,
            statusCode: validated.urlValid ? 200 : 404
          }
        });
      } catch (error) {
        logger.error("Validation error", { title: record.title, error });
        errors.push(`Validation error: ${record.title}`);
      }
    }

    logger.info("Validation complete", {
      sessionId: config.sessionId,
      recordsValidated: validatedRecords.length
    });

    // STEP 5: COMPLETE
    await convex.updateWorkflow({
      sessionId: config.sessionId,
      currentStep: "complete",
      status: "completed",
      validatedCount: validatedRecords.length,
      errorCount: errors.length,
      errors
    });

    const duration = Date.now() - startTime;

    logger.info("Pipeline complete", {
      sessionId: config.sessionId,
      duration,
      sources: sources.length,
      extracted: extractedRecords.length,
      categorized: categorizedRecords.length,
      validated: validatedRecords.length,
      errors: errors.length
    });

    return {
      sessionId: config.sessionId,
      sourcesFound: sources.length,
      recordsExtracted: extractedRecords.length,
      recordsCategorized: categorizedRecords.length,
      recordsValidated: validatedRecords.length,
      errors,
      duration
    };
  } catch (error) {
    logger.error("Pipeline fatal error", { sessionId: config.sessionId, error });

    await convex.updateWorkflow({
      sessionId: config.sessionId,
      status: "failed",
      errorCount: errors.length + 1,
      errors: [...errors, `Fatal error: ${error}`]
    });

    throw error;
  }
}
