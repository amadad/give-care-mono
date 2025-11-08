import { describe, it, expect } from 'vitest';
import { deriveEntitlements } from '../convex/lib/billing';

describe('Billing - Entitlements', () => {
  describe('deriveEntitlements', () => {
    it('free plan has assessments only', () => {
      const entitlements = deriveEntitlements('free');

      expect(entitlements).toHaveLength(2);
      expect(entitlements).toContainEqual({ name: 'assessments', active: true });
      expect(entitlements).toContainEqual({ name: 'interventions', active: false });
    });

    it('plus plan has assessments and interventions', () => {
      const entitlements = deriveEntitlements('plus');

      expect(entitlements).toHaveLength(2);
      expect(entitlements).toContainEqual({ name: 'assessments', active: true });
      expect(entitlements).toContainEqual({ name: 'interventions', active: true });
    });

    it('enterprise plan has all features including live coach', () => {
      const entitlements = deriveEntitlements('enterprise');

      expect(entitlements).toHaveLength(3);
      expect(entitlements).toContainEqual({ name: 'assessments', active: true });
      expect(entitlements).toContainEqual({ name: 'interventions', active: true });
      expect(entitlements).toContainEqual({ name: 'live_coach', active: true });
    });

    it('all entitlements are active except free tier interventions', () => {
      const freeTier = deriveEntitlements('free');
      const plusTier = deriveEntitlements('plus');
      const enterpriseTier = deriveEntitlements('enterprise');

      // Free tier should have one inactive feature
      const inactiveFree = freeTier.filter(e => !e.active);
      expect(inactiveFree).toHaveLength(1);
      expect(inactiveFree[0].name).toBe('interventions');

      // Plus and enterprise should have all active
      expect(plusTier.every(e => e.active)).toBe(true);
      expect(enterpriseTier.every(e => e.active)).toBe(true);
    });

    it('enterprise plan is superset of plus plan', () => {
      const plusTier = deriveEntitlements('plus');
      const enterpriseTier = deriveEntitlements('enterprise');

      const plusFeatures = plusTier.map(e => e.name);
      const enterpriseFeatures = enterpriseTier.map(e => e.name);

      // All plus features should be in enterprise
      plusFeatures.forEach(feature => {
        expect(enterpriseFeatures).toContain(feature);
      });

      // Enterprise should have more features than plus
      expect(enterpriseFeatures.length).toBeGreaterThan(plusFeatures.length);
    });
  });
});
