import { describe, it, expect } from 'vitest';
import {
  extractProfileVariables,
  getNextMissingField,
  buildWellnessInfo,
  getProfileFromMetadata,
} from '../../convex/lib/profile';
import type { UserProfile, AgentMetadata } from '../../convex/lib/types';

describe('Profile Utilities', () => {
  describe('extractProfileVariables', () => {
    it('extracts profile variables correctly', () => {
      const profile: UserProfile = {
        firstName: 'Sarah',
        relationship: 'daughter',
        careRecipientName: 'Mom',
      };
      
      const result = extractProfileVariables(profile);
      
      expect(result.userName).toBe('Sarah');
      expect(result.relationship).toBe('daughter');
      expect(result.careRecipient).toBe('Mom');
    });

    it('uses defaults when profile is undefined', () => {
      const result = extractProfileVariables(undefined);
      
      expect(result.userName).toBe('there');
      expect(result.relationship).toBe('caregiver');
      expect(result.careRecipient).toBe('loved one');
    });

    it('uses defaults when profile fields are missing', () => {
      const profile: UserProfile = {};
      const result = extractProfileVariables(profile);
      
      expect(result.userName).toBe('there');
      expect(result.relationship).toBe('caregiver');
      expect(result.careRecipient).toBe('loved one');
    });
  });

  describe('getNextMissingField', () => {
    it('returns careRecipientName first', () => {
      const result = getNextMissingField(undefined, {});
      
      expect(result?.field).toBe('careRecipientName');
      expect(result?.prompt).toContain("Who are you caring for");
    });

    it('returns zipCode when needsLocalResources is true', () => {
      const profile: UserProfile = { careRecipientName: 'Mom' };
      const result = getNextMissingField(profile, { needsLocalResources: true });
      
      expect(result?.field).toBe('zipCode');
      expect(result?.prompt).toContain("ZIP code");
    });

    it('does not return zipCode when needsLocalResources is false', () => {
      const profile: UserProfile = { careRecipientName: 'Mom' };
      const result = getNextMissingField(profile, { needsLocalResources: false });
      
      expect(result?.field).not.toBe('zipCode');
      expect(result?.field).toBe('firstName');
    });

    it('returns firstName after careRecipientName', () => {
      const profile: UserProfile = { careRecipientName: 'Mom' };
      const result = getNextMissingField(profile, {});
      
      expect(result?.field).toBe('firstName');
      expect(result?.prompt).toContain("call you");
    });

    it('returns relationship after firstName and careRecipientName', () => {
      const profile: UserProfile = {
        firstName: 'Sarah',
        careRecipientName: 'Mom',
      };
      const result = getNextMissingField(profile, {});
      
      expect(result?.field).toBe('relationship');
      expect(result?.prompt).toContain("relationship");
    });

    it('returns null when all fields are present', () => {
      const profile: UserProfile = {
        firstName: 'Sarah',
        relationship: 'daughter',
        careRecipientName: 'Mom',
        zipCode: '94103',
      };
      const result = getNextMissingField(profile, {});
      
      expect(result).toBeNull();
    });
  });

  describe('buildWellnessInfo', () => {
    it('returns empty string when metadata is undefined', () => {
      const result = buildWellnessInfo(undefined);
      expect(result).toBe('');
    });

    it('returns empty string when no wellness data', () => {
      const metadata: AgentMetadata = {};
      const result = buildWellnessInfo(metadata);
      expect(result).toBe('');
    });

    it('includes wellness score when available', () => {
      const metadata: AgentMetadata = {
        wellnessScore: 65,
      };
      const result = buildWellnessInfo(metadata);
      expect(result).toContain('wellness score: 65');
    });

    it('includes pressure zones when available', () => {
      const metadata: AgentMetadata = {
        pressureZones: ['emotional', 'physical'],
      };
      const result = buildWellnessInfo(metadata);
      expect(result).toContain('Areas of concern: emotional, physical');
    });

    it('includes both wellness score and pressure zones', () => {
      const metadata: AgentMetadata = {
        wellnessScore: 65,
        pressureZones: ['emotional', 'physical'],
      };
      const result = buildWellnessInfo(metadata);
      expect(result).toContain('wellness score: 65');
      expect(result).toContain('Areas of concern: emotional, physical');
    });
  });

  describe('getProfileFromMetadata', () => {
    it('extracts profile from metadata', () => {
      const metadata = {
        profile: {
          firstName: 'Sarah',
          relationship: 'daughter',
        },
      };
      const result = getProfileFromMetadata(metadata);
      
      expect(result?.firstName).toBe('Sarah');
      expect(result?.relationship).toBe('daughter');
    });

    it('returns undefined when metadata is undefined', () => {
      const result = getProfileFromMetadata(undefined);
      expect(result).toBeUndefined();
    });

    it('returns undefined when profile is missing', () => {
      const metadata = {};
      const result = getProfileFromMetadata(metadata);
      expect(result).toBeUndefined();
    });
  });
});

