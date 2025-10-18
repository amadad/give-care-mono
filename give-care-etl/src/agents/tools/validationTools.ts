"use node";

/**
 * Validation Agent Tools
 *
 * Tools for validating phone numbers, URLs, and assigning quality scores
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { normalizeToE164 } from '../../utils/phoneValidator';
import { createLogger } from '../../utils/logger';

const logger = createLogger({ agentName: 'validation-tools' });

/**
 * Validate and normalize phone number to E.164 format
 */
export const validatePhone = tool({
  name: 'validatePhone',
  description: 'Validate a phone number and normalize to E.164 format (+1XXXXXXXXXX for US).',
  parameters: z.object({
    phone: z.string().describe('Phone number to validate'),
    defaultCountry: z.string().default('US').describe('Default country code if not specified'),
  }),
  execute: async ({ phone, defaultCountry }) => {
    try {
      logger.info('Validating phone', { phone });

      const normalized = normalizeToE164(phone, defaultCountry);

      if (!normalized) {
        return {
          valid: false,
          original: phone,
          error: 'Invalid phone number format',
        };
      }

      return {
        valid: true,
        original: phone,
        normalized,
        format: 'E.164',
      };

    } catch (error) {
      logger.error('Phone validation failed', { phone, error });
      return {
        valid: false,
        original: phone,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Validate URL accessibility and format
 */
export const validateURL = tool({
  name: 'validateURL',
  description: 'Validate a URL by checking format and accessibility (HEAD request).',
  parameters: z.object({
    url: z.string().describe('URL to validate'),
    checkAccessibility: z.boolean().default(true).describe('Check if URL is accessible'),
  }),
  execute: async ({ url, checkAccessibility }) => {
    try {
      logger.info('Validating URL', { url });

      // Check URL format
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        return {
          valid: false,
          url,
          error: 'Invalid URL format',
        };
      }

      // Check if HTTPS
      const isSecure = parsedUrl.protocol === 'https:';

      // Check accessibility if requested
      let accessible = null;
      let statusCode = null;

      if (checkAccessibility) {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'GiveCare-Bot/1.0 (+https://givecareapp.com)',
            },
          });

          accessible = response.ok;
          statusCode = response.status;

        } catch (error) {
          accessible = false;
          logger.warn('URL not accessible', { url, error });
        }
      }

      const valid = checkAccessibility ? (accessible === true) : true;

      return {
        valid,
        url,
        isSecure,
        accessible,
        statusCode,
        domain: parsedUrl.hostname,
      };

    } catch (error) {
      logger.error('URL validation failed', { url, error });
      return {
        valid: false,
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Calculate quality score for a resource record
 */
export const checkQuality = tool({
  name: 'checkQuality',
  description: 'Calculate quality score (0-100) for a resource record based on completeness and validity.',
  parameters: z.object({
    record: z.object({
      title: z.string().optional(),
      providerName: z.string().optional(),
      phones: z.array(z.string()).optional(),
      website: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      description: z.string().optional(),
      serviceTypes: z.array(z.string()).optional(),
    }).describe('Resource record to evaluate'),
  }),
  execute: async ({ record }) => {
    try {
      logger.info('Calculating quality score', {
        hasTitle: !!record.title,
        hasPhone: !!record.phones?.length,
        hasWebsite: !!record.website,
      });

      let score = 0;

      // Required fields (60 points)
      if (record.title) score += 15;
      if (record.providerName) score += 15;
      if (record.phones && record.phones.length > 0) score += 15;
      if (record.website) score += 15;

      // Optional but important fields (30 points)
      if (record.description && record.description.length > 50) score += 10;
      if (record.email) score += 10;
      if (record.address) score += 10;

      // Service types (10 points)
      if (record.serviceTypes && record.serviceTypes.length > 0) score += 10;

      // Penalties
      if (record.description && record.description.length < 20) score -= 5;
      if (!record.phones || record.phones.length === 0) score -= 10;

      // Clamp to 0-100
      score = Math.max(0, Math.min(100, score));

      const tier = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

      logger.info('Quality score calculated', { score, tier });

      return {
        score,
        tier,
        completeness: {
          requiredFields: [
            !!record.title,
            !!record.providerName,
            !!record.phones?.length,
            !!record.website,
          ].filter(Boolean).length,
          optionalFields: [
            !!record.description,
            !!record.email,
            !!record.address,
            !!record.serviceTypes?.length,
          ].filter(Boolean).length,
        },
        recommendations: generateRecommendations(record),
      };

    } catch (error) {
      logger.error('Quality check failed', { error });
      return {
        score: 0,
        tier: 'low',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

function generateRecommendations(record: any): string[] {
  const recommendations: string[] = [];

  if (!record.title) recommendations.push('Add title');
  if (!record.providerName) recommendations.push('Add provider name');
  if (!record.phones || record.phones.length === 0) recommendations.push('Add phone number');
  if (!record.website) recommendations.push('Add website URL');
  if (!record.description || record.description.length < 50) {
    recommendations.push('Add detailed description (50+ characters)');
  }
  if (!record.email) recommendations.push('Add email address');
  if (!record.address) recommendations.push('Add physical address');
  if (!record.serviceTypes || record.serviceTypes.length === 0) {
    recommendations.push('Specify service types');
  }

  return recommendations;
}

// Export all validation tools
export const validationTools = [
  validatePhone,
  validateURL,
  checkQuality,
];
