"use node";

/**
 * Discovery Agent - Exa API Only
 *
 * Uses Exa.ai semantic search for dynamic resource discovery.
 * No hardcoded sources - all discovery is done via neural search.
 */

import { DiscoveredSource } from "../shared/types";
import { discoverWithExa } from "./discovery.exa";

/**
 * REMOVED: Hardcoded authoritative sources
 * All discovery now uses Exa API for real-time, semantic search
 */
const AUTHORITATIVE_SOURCES_REMOVED: Record<string, DiscoveredSource[]> = {
  // National resources (all states)
  national: [
    {
      url: "https://eldercare.acl.gov/Public/Index.aspx",
      title: "Eldercare Locator - ACL",
      snippet: "Federal government resource locator for caregiver support services",
      sourceType: "government",
      credibilityScore: 95,
      priority: "high",
      estimatedResourceCount: 500
    },
    {
      url: "https://www.caregiver.org/connecting-caregivers/services-by-state/",
      title: "Family Caregiver Alliance - State Services",
      snippet: "Comprehensive state-by-state caregiver support directory",
      sourceType: "nonprofit",
      credibilityScore: 90,
      priority: "high",
      estimatedResourceCount: 200
    },
    {
      url: "https://www.aarp.org/caregiving/local/",
      title: "AARP Caregiving Resource Center",
      snippet: "Local caregiver resources and support services",
      sourceType: "nonprofit",
      credibilityScore: 85,
      priority: "high",
      estimatedResourceCount: 300
    },
    {
      url: "https://www.alz.org/help-support/caregiving",
      title: "Alzheimer's Association - Caregiver Center",
      snippet: "Caregiver support, respite care, and counseling services",
      sourceType: "nonprofit",
      credibilityScore: 90,
      priority: "high",
      estimatedResourceCount: 150
    },
    {
      url: "https://www.caregiver.va.gov/",
      title: "VA Caregiver Support",
      snippet: "Support services for caregivers of veterans",
      sourceType: "government",
      credibilityScore: 95,
      priority: "high",
      estimatedResourceCount: 100
    }
  ],

  // New York specific
  NY: [
    {
      url: "https://aging.ny.gov/programs/caregiver-support",
      title: "NY State Office for the Aging - Caregiver Support",
      snippet: "State-funded caregiver support programs and services",
      sourceType: "state_agency",
      credibilityScore: 95,
      priority: "high",
      estimatedResourceCount: 50
    },
    {
      url: "https://www.211.org/",
      title: "211 New York",
      snippet: "Comprehensive directory of health and human services",
      sourceType: "aggregator",
      credibilityScore: 85,
      priority: "high",
      estimatedResourceCount: 200
    }
  ],

  // California specific
  CA: [
    {
      url: "https://aging.ca.gov/Programs_and_Services/Caregiver_Resource_Centers/",
      title: "California Caregiver Resource Centers",
      snippet: "State-wide network of caregiver resource centers",
      sourceType: "state_agency",
      credibilityScore: 95,
      priority: "high",
      estimatedResourceCount: 75
    }
  ],

  // Texas specific
  TX: [
    {
      url: "https://www.dads.state.tx.us/services/familycaregiver/",
      title: "Texas Health and Human Services - Family Caregiver Support",
      snippet: "Texas caregiver support programs",
      sourceType: "state_agency",
      credibilityScore: 90,
      priority: "high",
      estimatedResourceCount: 60
    }
  ]
};

/**
 * Discover caregiver resource sources using Exa API ONLY
 *
 * Strategy:
 * 1. Exa API semantic search (dynamic, comprehensive, semantic)
 * 2. Deduplicate results
 * 3. Sort by credibility score and priority
 *
 * REMOVED: Hardcoded sources - all discovery is now dynamic via Exa
 */
export async function discoverSources(
  state?: string,
  limit: number = 20,
  exaApiKey?: string
): Promise<DiscoveredSource[]> {
  // Require Exa API key - no fallback to hardcoded sources
  if (!exaApiKey) {
    throw new Error("Exa API key is required for discovery. No hardcoded sources available.");
  }

  try {
    const query = state
      ? `caregiver support services and resources in ${state}`
      : "caregiver support services and resources nationwide";

    const exaSources = await discoverWithExa(query, {
      state,
      limit,
      apiKey: exaApiKey
    });

    // Deduplicate by URL
    const uniqueSources = Array.from(
      new Map(exaSources.map(s => [s.url, s])).values()
    );

    // Sort by credibility score and priority
    uniqueSources.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.credibilityScore - a.credibilityScore;
    });

    return uniqueSources.slice(0, limit);
  } catch (error) {
    console.error("Exa API error:", error);
    throw new Error(`Discovery failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
