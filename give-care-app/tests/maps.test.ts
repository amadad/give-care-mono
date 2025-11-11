import { describe, it, expect } from 'vitest';
import { extractLocation, CAREGIVING_QUERIES } from '../convex/lib/maps';

describe('Google Maps Integration', () => {
  describe('extractLocation', () => {
    it('should extract zip code from metadata', () => {
      const metadata = {
        profile: {
          zipCode: '90210',
        },
      };

      const location = extractLocation(metadata);

      expect(location).toEqual({
        zipCode: '90210',
        address: undefined,
        latitude: undefined,
        longitude: undefined,
      });
    });

    it('should extract full address from metadata', () => {
      const metadata = {
        profile: {
          address: '123 Main St, Los Angeles, CA 90001',
        },
      };

      const location = extractLocation(metadata);

      expect(location).toEqual({
        zipCode: undefined,
        address: '123 Main St, Los Angeles, CA 90001',
        latitude: undefined,
        longitude: undefined,
      });
    });

    it('should extract latitude and longitude from metadata', () => {
      const metadata = {
        profile: {
          latitude: 34.0522,
          longitude: -118.2437,
        },
      };

      const location = extractLocation(metadata);

      expect(location).toEqual({
        zipCode: undefined,
        address: undefined,
        latitude: 34.0522,
        longitude: -118.2437,
      });
    });

    it('should prioritize zip code over address', () => {
      const metadata = {
        profile: {
          zipCode: '90210',
          address: '123 Main St',
        },
      };

      const location = extractLocation(metadata);

      expect(location?.zipCode).toBe('90210');
      expect(location?.address).toBe('123 Main St');
    });

    it('should return null when profile is missing', () => {
      const metadata = {};

      const location = extractLocation(metadata);

      expect(location).toBeNull();
    });

    it('should return empty location when no location data present', () => {
      const metadata = {
        profile: {
          firstName: 'Jane',
        },
      };

      const location = extractLocation(metadata);

      expect(location).toEqual({
        zipCode: undefined,
        address: undefined,
        latitude: undefined,
        longitude: undefined,
      });
    });
  });

  describe('CAREGIVING_QUERIES', () => {
    it('should have predefined queries for common resources', () => {
      expect(CAREGIVING_QUERIES.respiteCare).toContain('respite care');
      expect(CAREGIVING_QUERIES.supportGroups).toContain('support groups');
      expect(CAREGIVING_QUERIES.adultDayCare).toContain('adult day care');
      expect(CAREGIVING_QUERIES.homeCare).toContain('home health care');
    });

    it('should have all expected resource categories', () => {
      const expectedCategories = [
        'respiteCare',
        'supportGroups',
        'adultDayCare',
        'homeCare',
        'medicalSupplies',
        'seniorCenters',
        'mealDelivery',
        'transportation',
        'hospice',
        'memoryCare',
      ];

      for (const category of expectedCategories) {
        expect(CAREGIVING_QUERIES).toHaveProperty(category);
        expect(typeof CAREGIVING_QUERIES[category as keyof typeof CAREGIVING_QUERIES]).toBe('string');
      }
    });

    it('should have descriptive queries that explain the need', () => {
      // Queries should be detailed enough to help Google Maps understand intent
      expect(CAREGIVING_QUERIES.respiteCare.length).toBeGreaterThan(30);
      expect(CAREGIVING_QUERIES.supportGroups.length).toBeGreaterThan(30);
    });
  });

  describe('Query Enhancement Logic', () => {
    it('should recognize caregiving keywords', () => {
      const caregivingTerms = [
        'respite',
        'adult day care',
        'support group',
        'caregiver',
        'hospice',
        'home health',
        'senior center',
        'memory care',
        'alzheimer',
      ];

      // Verify these terms exist in predefined queries
      const allQueries = Object.values(CAREGIVING_QUERIES).join(' ').toLowerCase();

      for (const term of caregivingTerms) {
        expect(allQueries).toContain(term.toLowerCase());
      }
    });
  });

  describe('Location Preference Priority', () => {
    it('should prioritize zip code (most common)', () => {
      const metadata = {
        profile: {
          zipCode: '90210',
          address: '123 Main St',
          latitude: 34.0522,
          longitude: -118.2437,
        },
      };

      const location = extractLocation(metadata);

      // Zip code should be present as it's preferred
      expect(location?.zipCode).toBe('90210');
      // But other fields should also be available
      expect(location?.address).toBe('123 Main St');
      expect(location?.latitude).toBe(34.0522);
    });
  });
});
