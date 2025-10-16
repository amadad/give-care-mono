"use node";

/**
 * Simplified Extraction Agent
 *
 * Uses OpenAI to extract structured data from HTML content
 * Phase 1: Simple fetch + GPT extraction
 * Phase 2: Add Browser Rendering API for complex pages
 */

import { IntermediateRecord } from "../shared/types";
import { createLogger } from "../utils/logger";

const logger = createLogger({ agentName: "extraction" });

/**
 * Extract structured resource data from a URL
 */
export async function extractResourceFromUrl(
  url: string,
  openaiApiKey: string
): Promise<IntermediateRecord | null> {
  try {
    // Fetch HTML content
    logger.info("Fetching URL", { url });
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GiveCareBot/1.0 (+https://givecareapp.com)"
      }
    });

    if (!response.ok) {
      logger.error("Failed to fetch URL", { url, status: response.status });
      return null;
    }

    const html = await response.text();

    // Extract text content (remove HTML tags for simplicity)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 8000); // Limit to 8000 chars

    logger.info("Extracted text", { url, textLength: text.length });

    // Use OpenAI to extract structured data
    const extracted = await extractWithGPT(text, url, openaiApiKey);

    return extracted;
  } catch (error) {
    logger.error("Extraction error", { url, error });
    return null;
  }
}

/**
 * Use GPT to extract structured resource data from text
 */
async function extractWithGPT(
  text: string,
  sourceUrl: string,
  openaiApiKey: string
): Promise<IntermediateRecord | null> {
  const prompt = `Extract caregiver support resource information from this text.

Return JSON with these fields:
{
  "title": "Program name",
  "description": "2-3 sentence summary of what this program offers",
  "providerName": "Organization name",
  "phones": ["phone numbers found"],
  "website": "program website",
  "email": "contact email if found",
  "address": "street address",
  "city": "city name",
  "state": "2-letter state code",
  "zip": "ZIP code",
  "serviceTypes": ["respite", "support_group", "counseling", "crisis_support", "financial_aid", "medicare_help", "legal_planning", "navigation", "equipment_devices", "education_training", "caregiver_support"],
  "coverage": "national" | "state" | "county" | "zip" | "radius",
  "hours": "hours of operation",
  "eligibility": "who can access",
  "languages": ["en", "es", etc]
}

Service type keywords:
- respite: temporary care, relief care, short-term care
- support_group: peer support, caregiver group, community
- counseling: therapy, mental health, psychologist
- crisis_support: crisis, hotline, emergency, 24/7
- financial_aid: financial assistance, grants, subsidies
- medicare_help: medicare, medicaid, insurance, benefits
- legal_planning: legal, attorney, will, power of attorney
- navigation: case management, coordination, referrals
- equipment_devices: equipment, wheelchair, walker, assistive
- education_training: training, education, workshop, class
- caregiver_support: caregiver support, family support

Only include fields you can extract. Return valid JSON only.

TEXT:
${text}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Fast and cheap for extraction
        messages: [
          {
            role: "system",
            content: "You are a data extraction assistant. Extract structured information from text and return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("OpenAI API error", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody.substring(0, 500) // First 500 chars
      });
      return null;
    }

    const data = await response.json() as any;
    const extracted = JSON.parse(data.choices[0].message.content);

    // Add metadata
    const record: IntermediateRecord = {
      ...extracted,
      serviceTypes: extracted.serviceTypes || [],
      zones: [], // Will be populated by Categorizer
      coverage: extracted.coverage || "state",
      dataSourceType: "scraped",
      aggregatorSource: determineAggregatorSource(sourceUrl),
      sourceUrl,
      lastVerified: new Date().toISOString()
    };

    logger.info("Extracted record", { title: record.title, serviceTypes: record.serviceTypes });

    return record;
  } catch (error) {
    logger.error("GPT extraction error", {
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
  if (url.includes("carelinq")) return "carelinq";
  return "other";
}
