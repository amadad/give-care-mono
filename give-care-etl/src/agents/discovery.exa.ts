"use node";

/**
 * Exa API Discovery Agent
 *
 * Uses Exa.ai neural search for semantic, dynamic resource discovery
 */

import Exa from "exa-js";
import { DiscoveredSource } from "../shared/types";
import { createLogger } from "../utils/logger";

const logger = createLogger({ agentName: "discovery-exa" });

// Service type keywords for semantic queries
const SERVICE_TYPE_KEYWORDS: Record<string, string> = {
  respite: "temporary relief care short-term respite",
  support_group: "peer support caregiver groups community meetings",
  counseling: "therapy mental health counseling psychologist",
  crisis_support: "crisis hotline emergency 24/7 urgent",
  financial_aid: "financial assistance grants subsidies funding",
  medicare_help: "medicare medicaid insurance benefits coverage",
  legal_planning: "legal attorney will power of attorney estate planning",
  navigation: "case management care coordination referrals navigation",
  equipment_devices: "equipment wheelchair walker assistive devices durable medical",
  education_training: "training education workshop class seminar caregiver education",
  caregiver_support: "family support caregiver assistance help resources"
};

/**
 * Discover sources using Exa API neural search
 */
export async function discoverWithExa(
  query: string,
  options: {
    state?: string;
    serviceType?: string;
    limit?: number;
    apiKey: string;
  }
): Promise<DiscoveredSource[]> {
  const exa = new Exa(options.apiKey);

  // Build semantic query
  const semanticQuery = buildSemanticQuery(query, options.state, options.serviceType);

  logger.info("Exa search starting", {
    query: semanticQuery,
    state: options.state,
    limit: options.limit
  });

  try {
    // Use searchAndContents for simplicity (subpages feature isn't working reliably)
    const results = await exa.searchAndContents(semanticQuery, {
      type: "neural",  // Semantic understanding
      numResults: Math.min((options.limit ?? 20) * 3, 50),  // Request 3x to account for filtering
      category: "health",
      useAutoprompt: true,  // Let Exa optimize the query
      text: {
        maxCharacters: 2000,  // Get enough for quality assessment
        includeHtmlTags: false
      },
      highlights: {
        numSentences: 3,
        highlightsPerUrl: 5
      }
    });

    logger.info("Exa search completed", {
      resultsCount: results.results.length,
      autopromptString: results.autopromptString
    });

    // Filter and map results
    const sources = results.results
      .filter(result => {
        // Filter out bad URLs
        const url = result.url.toLowerCase();
        const title = (result.title || "").toLowerCase();

        // Skip error pages, search pages, and generic directories
        if (
          url.includes("/error") ||
          url.includes("/404") ||
          url.includes("/search") ||
          url.includes("/browse-search") ||
          url.includes("?aspxerrorpath") ||
          title.includes("error") ||
          title === "error" ||
          title === "welcome" ||
          !result.text ||
          result.text.length < 200  // Skip pages with too little content
        ) {
          logger.info("Filtered out bad URL", { url, title, reason: "error/search page or insufficient content" });
          return false;
        }

        return true;
      })
      .map((result, index) => {
        const source: DiscoveredSource = {
          url: result.url,
          title: result.title || extractTitleFromUrl(result.url),
          snippet: result.text?.substring(0, 300) || "",
          sourceType: detectSourceType(result.url),
          credibilityScore: calculateCredibilityScore(result, options.serviceType),
          priority: index < 5 ? "high" : index < 15 ? "medium" : "low",
          estimatedResourceCount: estimateResourceCount(result.highlights || [], result.text || "")
        };

        logger.info("Discovered source", {
          url: source.url,
          title: source.title,
          credibilityScore: source.credibilityScore,
          sourceType: source.sourceType
        });

        return source;
      })
      .slice(0, options.limit);  // Return only requested number after filtering

    logger.info("Filtered sources", {
      original: results.results.length,
      filtered: sources.length
    });

    return sources;

  } catch (error) {
    logger.error("Exa search failed", {
      error: error instanceof Error ? error.message : String(error),
      query: semanticQuery
    });
    throw error;
  }
}

/**
 * Build semantic query for Exa
 */
function buildSemanticQuery(
  baseQuery: string,
  state?: string,
  serviceType?: string
): string {
  let query = baseQuery;

  // Add state context
  if (state) {
    query = `${state} state ${query}`;
  }

  // Add service type keywords for semantic matching
  if (serviceType && SERVICE_TYPE_KEYWORDS[serviceType]) {
    query = `${query} ${SERVICE_TYPE_KEYWORDS[serviceType]}`;
  }

  // Add context for better semantic matching
  query = `${query} government programs services directory information`;

  return query;
}

/**
 * Calculate credibility score from Exa result
 */
function calculateCredibilityScore(
  result: any,
  serviceType?: string
): number {
  let score = 50;  // Base score

  // Domain signals (strongest)
  if (result.url.includes('.gov')) score += 30;
  else if (result.url.includes('.edu')) score += 20;
  else if (result.url.includes('.org')) score += 15;

  // Known authoritative domains (bonus)
  const authoritativeDomains = [
    'eldercare.acl.gov',
    'aging.ny.gov',
    'aging.ca.gov',
    'caregiver.org',
    'aarp.org',
    'alz.org',
    'va.gov',
    '211.org'
  ];
  if (authoritativeDomains.some(domain => result.url.includes(domain))) {
    score += 15;
  }

  // Content signals from highlights
  if (result.highlights && result.highlights.length > 0) {
    const keywords = ['caregiver', 'support', 'services', 'program', 'assistance'];
    const matchCount = result.highlights.filter((h: string) =>
      keywords.some(k => h.toLowerCase().includes(k))
    ).length;
    score += Math.min(matchCount * 3, 15);
  }

  // Service type relevance
  if (serviceType && result.text) {
    const serviceKeywords = SERVICE_TYPE_KEYWORDS[serviceType]?.split(' ') || [];
    const matchCount = serviceKeywords.filter(keyword =>
      result.text.toLowerCase().includes(keyword)
    ).length;
    score += Math.min(matchCount * 2, 10);
  }

  // Freshness (if published date available)
  if (result.publishedDate) {
    try {
      const age = Date.now() - new Date(result.publishedDate).getTime();
      const yearsOld = age / (365 * 24 * 60 * 60 * 1000);
      if (yearsOld < 1) score += 10;
      else if (yearsOld < 2) score += 5;
      else if (yearsOld > 5) score -= 10;
    } catch (e) {
      // Invalid date, ignore
    }
  }

  // Exa's own score (if available)
  if (result.score && result.score > 0.8) score += 5;

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Detect source type from URL
 */
function detectSourceType(url: string): DiscoveredSource['sourceType'] {
  if (url.includes('.gov')) {
    if (url.includes('state.') || url.includes('aging.')) return 'state_agency';
    return 'government';
  }
  if (url.includes('.edu')) return 'other';  // Universities
  if (url.includes('211')) return 'aggregator';
  if (url.includes('.org')) return 'nonprofit';
  return 'other';
}

/**
 * Estimate resource count from content
 */
function estimateResourceCount(highlights: string[], text: string): number {
  // Look for indicators of multiple resources
  const indicators = [
    'directory',
    'database',
    'search',
    'find services',
    'locate',
    'counties',
    'statewide',
    'nationwide'
  ];

  const hasIndicators = indicators.some(indicator =>
    text.toLowerCase().includes(indicator) ||
    highlights.some(h => h.toLowerCase().includes(indicator))
  );

  if (hasIndicators) {
    // Likely an aggregator with many resources
    if (text.includes('nationwide') || text.includes('national')) return 500;
    if (text.includes('statewide') || text.includes('state')) return 100;
    if (text.includes('county') || text.includes('counties')) return 50;
    return 20;
  }

  // Likely a single resource/program
  return 1;
}

/**
 * Extract title from URL as fallback
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
    const lastPart = pathParts[pathParts.length - 1] || urlObj.hostname;

    // Clean up: remove extensions, replace hyphens/underscores with spaces, capitalize
    return lastPart
      .replace(/\.(html?|php|aspx?)$/i, '')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return url;
  }
}
