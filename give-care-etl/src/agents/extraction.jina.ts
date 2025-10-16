"use node";

/**
 * Jina Reader Extraction Agent
 *
 * Uses Jina.ai Reader API for clean content extraction, then GPT for structured data
 * Replaces llm-scraper-worker with a simpler, faster, free approach
 */

import { IntermediateRecord } from "../shared/types";
import { createLogger } from "../utils/logger";

const logger = createLogger({ agentName: "extraction-jina" });

/**
 * Extract structured resource data from a URL using Jina Reader + GPT
 */
export async function extractResourceFromUrl(
  url: string,
  openaiApiKey: string
): Promise<IntermediateRecord | null> {
  try {
    logger.info("Extracting with Jina Reader", { url });

    // Step 1: Fetch clean content from Jina Reader API
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Accept": "application/json",
        "X-Return-Format": "markdown"
      }
    });

    if (!jinaResponse.ok) {
      logger.error("Jina Reader failed", {
        url,
        status: jinaResponse.status,
        statusText: jinaResponse.statusText
      });
      return null;
    }

    const jinaData = await jinaResponse.json();

    // Check if Jina detected an error (404, etc)
    if (jinaData.code === 404 || jinaData.status === 40400) {
      logger.warn("URL not found (404)", { url });
      return null;
    }

    const content = jinaData.data?.content;
    if (!content || content.length < 200) {
      logger.warn("Insufficient content from Jina", {
        url,
        contentLength: content?.length || 0
      });
      return null;
    }

    logger.info("Jina Reader successful", {
      url,
      contentLength: content.length,
      tokens: jinaData.data?.usage?.tokens || 0
    });

    // Step 2: Use OpenAI Responses API to extract structured data
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: `Extract caregiver support resource information from this webpage.

SOURCE: ${url}

EXTRACT these fields as JSON:
- title: Program/service name
- providerName: Organization name
- phones: Phone numbers (array, can be empty)
- website: Website URL
- serviceTypes: Service types from: respite, support_group, counseling, crisis_support, financial_aid, medicare_help, legal_planning, navigation, equipment_devices, education_training, caregiver_support
- coverage: Geographic coverage (national/state/county/zip/radius)
- description: Brief description
- state: 2-letter state code

CONTENT:
${content.substring(0, 6000)}`
          }
        ],
        text: {
          format: {
            type: "json_object"
          }
        }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      logger.error("OpenAI Responses API error", new Error(errorText), {
        url,
        status: openaiResponse.status,
        statusText: openaiResponse.statusText
      });
      return null;
    }

    const result = await openaiResponse.json();

    // Check for refusal
    if (result.output?.[0]?.content?.[0]?.type === "refusal") {
      logger.warn("OpenAI refused request", {
        url,
        refusal: result.output[0].content[0].refusal
      });
      return null;
    }

    const extracted = JSON.parse(result.output[0].content[0].text);

    logger.info("Extraction successful", {
      url,
      title: extracted.title,
      serviceTypes: extracted.serviceTypes?.length || 0,
      hasPhone: !!(extracted.phones && extracted.phones.length > 0)
    });

    // Build IntermediateRecord
    return {
      title: extracted.title || "Unknown Service",
      providerName: extracted.providerName || "Unknown Provider",
      phones: extracted.phones || [],
      website: extracted.website || url,
      email: extracted.email,
      serviceTypes: extracted.serviceTypes || ["caregiver_support"],
      zones: [], // Will be populated by Categorizer
      coverage: extracted.coverage || "state",
      description: extracted.description,
      eligibility: extracted.eligibility,
      languages: extracted.languages,
      hours: extracted.hours,
      address: extracted.address,
      city: extracted.city,
      state: extracted.state,
      zip: extracted.zip,
      fundingSource: extracted.fundingSource,
      dataSourceType: "scraped" as const,
      aggregatorSource: determineAggregatorSource(url),
      sourceUrl: url,
      lastVerified: new Date().toISOString()
    };
  } catch (error) {
    logger.error("Extraction error", {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

/**
 * Determine aggregator source from URL
 */
function determineAggregatorSource(url: string): string {
  if (url.includes("eldercare.acl.gov")) return "eldercare";
  if (url.includes("211")) return "211";
  if (url.includes("nyconnects")) return "nyconnects";
  if (url.includes("carelinq")) return "carelinq";
  return "other";
}
