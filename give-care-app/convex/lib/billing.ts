/**
 * Billing Utilities
 *
 * Plan entitlements and feature access control
 */

export type PlanId = 'free' | 'plus' | 'enterprise';

export interface Entitlement {
  name: string;
  active: boolean;
}

/**
 * Derive entitlements for a given plan
 *
 * @param planId - The plan identifier ('free', 'plus', 'enterprise')
 * @returns Array of entitlements with name and active status
 */
export function deriveEntitlements(planId: PlanId): Entitlement[] {
  switch (planId) {
    case 'free':
      return [
        { name: 'assessments', active: true },
        { name: 'interventions', active: false },
      ];

    case 'plus':
      return [
        { name: 'assessments', active: true },
        { name: 'interventions', active: true },
      ];

    case 'enterprise':
      return [
        { name: 'assessments', active: true },
        { name: 'interventions', active: true },
        { name: 'live_coach', active: true },
      ];

    default:
      // Default to free plan for unknown plans
      return [
        { name: 'assessments', active: true },
        { name: 'interventions', active: false },
      ];
  }
}

