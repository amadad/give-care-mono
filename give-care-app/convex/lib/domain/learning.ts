/**
 * Learning Domain Logic
 * Pure functions for analyzing intervention effectiveness
 * No Convex dependencies
 */

export interface InterventionEvent {
  interventionId: string;
  zone: string;
  success: boolean;
  timestamp: number;
}

export interface InterventionEffectiveness {
  interventionId: string;
  zone: string;
  successRate: number; // 0-1
  totalTries: number;
  totalSuccesses: number;
}

/**
 * Analyze intervention effectiveness from events
 * Pure function - CONVEX_01.md helper pattern
 */
export function analyzeInterventionEffectiveness(
  events: InterventionEvent[]
): InterventionEffectiveness[] {
  // Group events by intervention + zone
  const grouped = new Map<string, {
    interventionId: string;
    zone: string;
    tries: number;
    successes: number;
  }>();

  for (const event of events) {
    const key = `${event.interventionId}:${event.zone}`;
    const group = grouped.get(key) || {
      interventionId: event.interventionId,
      zone: event.zone,
      tries: 0,
      successes: 0,
    };

    group.tries++;
    if (event.success) {
      group.successes++;
    }

    grouped.set(key, group);
  }

  // Calculate effectiveness
  const results: InterventionEffectiveness[] = [];
  for (const group of grouped.values()) {
    results.push({
      interventionId: group.interventionId,
      zone: group.zone,
      successRate: group.tries > 0 ? group.successes / group.tries : 0,
      totalTries: group.tries,
      totalSuccesses: group.successes,
    });
  }

  // Sort by success rate (descending)
  return results.sort((a, b) => b.successRate - a.successRate);
}

/**
 * Rank interventions for given zones by effectiveness
 * Pure function
 */
export function rankInterventionsForZones(
  effectiveness: InterventionEffectiveness[],
  zones: string[]
): InterventionEffectiveness[] {
  // Filter to interventions matching the zones
  const matching = effectiveness.filter((e) => zones.includes(e.zone));

  // Sort by success rate, then by total tries (for tie-breaking)
  return matching.sort((a, b) => {
    if (b.successRate !== a.successRate) {
      return b.successRate - a.successRate;
    }
    return b.totalTries - a.totalTries;
  });
}

