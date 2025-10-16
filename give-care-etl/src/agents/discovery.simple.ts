"use node";

/**
 * Simplified Discovery Agent
 *
 * Returns a curated list of high-quality caregiver resource sources
 * until we integrate workers-research in Phase 2
 */

import { DiscoveredSource } from "../shared/types";

/**
 * Curated list of authoritative caregiver resource sources
 */
const AUTHORITATIVE_SOURCES: Record<string, DiscoveredSource[]> = {
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
 * Discover caregiver resource sources
 */
export async function discoverSources(
  state?: string,
  limit: number = 10
): Promise<DiscoveredSource[]> {
  const sources: DiscoveredSource[] = [];

  // Always include national sources
  sources.push(...AUTHORITATIVE_SOURCES.national);

  // Add state-specific sources if provided
  if (state && AUTHORITATIVE_SOURCES[state]) {
    sources.push(...AUTHORITATIVE_SOURCES[state]);
  }

  // Sort by credibility score and priority
  sources.sort((a, b) => {
    if (a.priority !== b.priority) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.credibilityScore - a.credibilityScore;
  });

  // Return limited number of sources
  return sources.slice(0, limit);
}
