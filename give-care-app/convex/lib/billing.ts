/**
 * Billing and entitlement utilities
 *
 * Migrated from src/services/billing.ts for Convex-native usage.
 */

export type Entitlement = {
  name: string;
  active: boolean;
  expiresAt?: string;
};

/**
 * Derive user entitlements from subscription plan
 *
 * @param plan - Subscription plan level
 * @returns Array of entitlements for the plan
 */
export const deriveEntitlements = (plan: 'free' | 'plus' | 'enterprise'): Entitlement[] => {
  switch (plan) {
    case 'enterprise':
      return [
        { name: 'assessments', active: true },
        { name: 'interventions', active: true },
        { name: 'live_coach', active: true },
      ];
    case 'plus':
      return [
        { name: 'assessments', active: true },
        { name: 'interventions', active: true },
      ];
    default:
      return [{ name: 'assessments', active: true }, { name: 'interventions', active: false }];
  }
};
