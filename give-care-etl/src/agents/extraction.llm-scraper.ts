"use node";

/**
 * LLM Scraper Extraction Agent
 *
 * Uses llm-scraper-worker with Zod schemas for structured extraction
 * Replaces the simple HTML + GPT approach with proper scraping
 */

import LLMScraper from "llm-scraper-worker";
import puppeteer from "@cloudflare/puppeteer";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { IntermediateRecord } from "../shared/types";
import { createLogger } from "../utils/logger";

const logger = createLogger({ agentName: "extraction-llm-scraper" });

/**
 * Zod schema for caregiver resource extraction
 * Matches IntermediateRecord structure
 */
const CaregiverResourceSchema = z.object({
  title: z.string().describe("Program or service name"),
  providerName: z.string().describe("Organization providing the service"),

  // Contact info (at least one required)
  phones: z.array(z.string()).optional().describe("Phone numbers found on the page"),
  website: z.string().url().optional().describe("Website URL"),
  email: z.string().email().optional().describe("Contact email address"),

  // Categorization
  serviceTypes: z.array(z.enum([
    "respite",
    "support_group",
    "counseling",
    "crisis_support",
    "financial_aid",
    "medicare_help",
    "legal_planning",
    "navigation",
    "equipment_devices",
    "education_training",
    "caregiver_support"
  ])).describe("Types of services offered (select all that apply)"),

  // Coverage
  coverage: z.enum(["national", "state", "county", "zip", "radius"])
    .describe("Geographic coverage of the service"),

  // Optional enrichment
  description: z.string().optional()
    .describe("2-3 sentence summary of what this program offers"),
  eligibility: z.string().optional()
    .describe("Who can access this service (eligibility criteria)"),
  languages: z.array(z.string()).optional()
    .describe("Languages supported (ISO codes: en, es, zh, etc)"),
  hours: z.string().optional()
    .describe("Hours of operation"),

  // Location
  address: z.string().optional().describe("Street address"),
  city: z.string().optional().describe("City name"),
  state: z.string().length(2).optional().describe("2-letter state code"),
  zip: z.string().optional().describe("ZIP code"),

  // Funding
  fundingSource: z.enum([
    "federal",
    "state",
    "local",
    "nonprofit",
    "faith_based",
    "private"
  ]).optional().describe("Primary funding source")
});

/**
 * Extract structured resource data from a URL using llm-scraper-worker
 */
export async function extractResourceFromUrl(
  url: string,
  openaiApiKey: string,
  browserBinding?: Fetcher
): Promise<IntermediateRecord | null> {
  try {
    logger.info("Extracting with llm-scraper-worker", { url });

    // If no browser binding, fall back to simple fetch + GPT extraction
    if (!browserBinding) {
      logger.warn("No browser binding available, using simple extraction", { url });
      return await fallbackExtraction(url, openaiApiKey);
    }

    // Launch browser
    const browser = await puppeteer.launch(browserBinding);

    // Initialize OpenAI LLM
    const openai = createOpenAI({ apiKey: openaiApiKey });
    const llm = openai.chat("gpt-4o-mini");

    // Create LLM scraper
    const scraper = new LLMScraper(llm);

    // Open page
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    // Run scraper with Zod schema
    const { data } = await scraper.run(page, CaregiverResourceSchema, {
      format: "html"
    });

    // Close browser
    await page.close();
    await browser.close();

    if (!data) {
      logger.error("No data extracted", { url });
      return null;
    }

    // Build IntermediateRecord from extracted data
    const record: IntermediateRecord = {
      title: data.title,
      providerName: data.providerName,
      phones: data.phones,
      website: data.website,
      email: data.email,
      serviceTypes: data.serviceTypes || [],
      zones: [], // Will be populated by Categorizer
      coverage: data.coverage || "state",
      description: data.description,
      eligibility: data.eligibility,
      languages: data.languages,
      hours: data.hours,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      fundingSource: data.fundingSource,
      dataSourceType: "scraped",
      aggregatorSource: determineAggregatorSource(url),
      sourceUrl: url,
      lastVerified: new Date().toISOString()
    };

    logger.info("Extracted record", {
      title: record.title,
      serviceTypes: record.serviceTypes,
      hasPhone: !!record.phones?.length,
      hasWebsite: !!record.website
    });

    return record;
  } catch (error) {
    logger.error("Extraction error", {
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Try fallback extraction
    logger.info("Trying fallback extraction", { url });
    return await fallbackExtraction(url, openaiApiKey);
  }
}

/**
 * Fallback extraction using simple fetch + GPT (no browser)
 */
async function fallbackExtraction(
  url: string,
  openaiApiKey: string
): Promise<IntermediateRecord | null> {
  try {
    logger.info("Fetching URL", { url });

    const response = await fetch(url, {
      headers: { "User-Agent": "GiveCareBot/1.0 (+https://givecareapp.com)" }
    });

    if (!response.ok) {
      logger.error("Failed to fetch URL", { url, status: response.status });
      return null;
    }

    const html = await response.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 8000);

    logger.info("Extracted text", { url, textLength: text.length });

    // Use OpenAI direct API call with response_format
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a data extraction assistant. Extract caregiver support resource information from HTML content and return structured JSON."
          },
          {
            role: "user",
            content: `Extract the following information from this webpage content:
- title: Name of the program or service
- providerName: Organization providing the service
- phones: Array of phone numbers (strings)
- website: Website URL
- serviceTypes: Array of service types (respite, support_group, counseling, crisis_support, financial_aid, medicare_help, legal_planning, navigation, equipment_devices, education_training, caregiver_support)
- coverage: Geographic coverage (national, state, county, zip, or radius)
- description: Brief description of the service
- state: 2-letter state code if mentioned

TEXT:
${text}`
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      logger.error("OpenAI API error", {
        url,
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorText,
        headers: Object.fromEntries(openaiResponse.headers.entries())
      });
      return null;
    }

    const result = await openaiResponse.json();
    const extracted = JSON.parse(result.choices[0].message.content);

    logger.info("Extraction successful", {
      url,
      title: extracted.title,
      hasServiceTypes: !!extracted.serviceTypes
    });

    return {
      title: extracted.title || "Unknown Service",
      providerName: extracted.providerName || "Unknown Provider",
      phones: extracted.phones || [],
      website: extracted.website || url,
      email: undefined,
      serviceTypes: extracted.serviceTypes || ["caregiver_support"],
      zones: [],
      coverage: extracted.coverage || "state",
      description: extracted.description,
      eligibility: undefined,
      languages: undefined,
      hours: undefined,
      address: undefined,
      city: undefined,
      state: extracted.state,
      zip: undefined,
      fundingSource: undefined,
      dataSourceType: "scraped" as const,
      aggregatorSource: determineAggregatorSource(url),
      sourceUrl: url,
      lastVerified: new Date().toISOString()
    };
  } catch (error) {
    logger.error("Fallback extraction failed", {
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
  if (url.includes("carelinq")) return "carelinq";
  return "other";
}
