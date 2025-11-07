export type Entitlement = {
  name: string;
  active: boolean;
  expiresAt?: string;
};

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
