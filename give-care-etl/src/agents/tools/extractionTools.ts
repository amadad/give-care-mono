"use node";

/**
 * Extraction Agent Tools
 *
 * Tools for scraping and extracting structured data from web pages
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { createLogger } from '../../utils/logger';
import type { IntermediateRecord } from '../../shared/types';
import { mapServicesToZones, SERVICE_TYPES } from '../../shared/taxonomy';
import { normalizePhoneE164 } from '../../utils/phoneValidator';

const logger = createLogger({ agentName: 'extraction-tools' });

/**
 * Fetch page HTML content
 */
export const fetchPage = tool({
  name: 'fetchPage',
  description: 'Fetch HTML content from a URL. Handles JavaScript-rendered pages using Browser Rendering API if needed.',
  parameters: z.object({
    url: z.string().describe('URL to fetch'),
    useJavaScript: z.boolean().default(false).describe('Use Browser Rendering for JS-heavy pages'),
  }),
  execute: async ({ url, useJavaScript }) => {
    try {
      logger.info('Fetching page', { url, useJavaScript });

      if (useJavaScript) {
        // Browser rendering requires Cloudflare Workers runtime (not available in this context)
        throw new Error('Browser rendering not yet implemented - requires Cloudflare Workers runtime');
      }

      // Use standard fetch for static pages
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'GiveCare-Bot/1.0 (+https://givecareapp.com)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      return {
        url,
        html,
        length: html.length,
        method: 'fetch',
      };

    } catch (error) {
      logger.error('Fetch failed', { url, error });
      throw error;
    }
  },
});

/**
 * Extract structured data from HTML using LLM
 */
export const extractStructured = tool({
  name: 'extractStructured',
  description: 'Extract structured resource data from HTML content. Returns IntermediateRecord format.',
  parameters: z.object({
    html: z.string().describe('HTML content to extract from'),
    url: z.string().describe('Source URL (for context)'),
    schema: z.object({
      title: z.boolean().default(true),
      providerName: z.boolean().default(true),
      phones: z.boolean().default(true),
      website: z.boolean().default(true),
      serviceTypes: z.boolean().default(true),
      description: z.boolean().default(true),
      email: z.boolean().default(false),
      address: z.boolean().default(false),
    }).describe('Fields to extract'),
  }),
  execute: async ({ html, url, schema }) => {
    try {
      logger.info('Extracting structured data', { url, htmlLength: html.length });

      // Truncate HTML if too long (avoid token limits)
      const truncatedHtml = html.length > 50000
        ? html.substring(0, 50000) + '... [truncated]'
        : html;

      // Placeholder implementation (awaits LLM integration)
      const extracted: Partial<IntermediateRecord> = {
        title: extractField(truncatedHtml, 'title', 'h1, .title, .program-name'),
        providerName: extractField(truncatedHtml, 'provider', '.provider, .organization'),
        phones: extractPhones(truncatedHtml),
        website: url,
        serviceTypes: extractServiceTypes(truncatedHtml),
        description: extractField(truncatedHtml, 'description', 'p, .description'),
        sourceUrl: url,
        coverage: detectCoverage(truncatedHtml),
      };

      logger.info('Extraction complete', {
        url,
        fieldsExtracted: Object.keys(extracted).filter(k => extracted[k as keyof typeof extracted]),
      });

      return {
        success: true,
        record: extracted,
        fieldsExtracted: Object.keys(extracted).length,
      };

    } catch (error) {
      logger.error('Extraction failed', { url, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Parse pagination links from HTML
 */
export const parsePagination = tool({
  name: 'parsePagination',
  description: 'Detect and extract pagination links from HTML (e.g., "Next", "Page 2", etc.)',
  parameters: z.object({
    html: z.string().describe('HTML content'),
    baseUrl: z.string().describe('Base URL for resolving relative links'),
  }),
  execute: async ({ html, baseUrl }) => {
    try {
      logger.info('Parsing pagination', { baseUrl });

      // Simple regex-based pagination detection
      const paginationPatterns = [
        /<a[^>]+href=["']([^"']+)["'][^>]*>next/i,
        /<a[^>]+href=["']([^"']+)["'][^>]*>page\s+(\d+)/i,
        /<a[^>]+href=["']([^"']+)["'][^>]*>\d+/i,
      ];

      const nextLinks: string[] = [];

      for (const pattern of paginationPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            // Resolve relative URLs
            const link = new URL(match[1], baseUrl).href;
            nextLinks.push(link);
          }
        }
      }

      // Deduplicate
      const uniqueLinks = Array.from(new Set(nextLinks));

      logger.info('Pagination parsed', { linksFound: uniqueLinks.length });

      return {
        hasNextPage: uniqueLinks.length > 0,
        nextPageUrls: uniqueLinks,
        totalPages: uniqueLinks.length + 1, // Current page + next pages
      };

    } catch (error) {
      logger.error('Pagination parsing failed', { error });
      return {
        hasNextPage: false,
        nextPageUrls: [],
        totalPages: 1,
      };
    }
  },
});

function extractField(html: string, fieldName: string, selectors: string): string {
  // Basic regex extraction (replace with HTML parser in production)
  const pattern = new RegExp(`<[^>]+class=["']${selectors.split(',')[0].replace('.', '')}["'][^>]*>([^<]+)<`, 'i');
  const match = html.match(pattern);
  return match ? match[1].trim() : '';
}

function extractPhones(html: string): string[] {
  // Extract phone numbers using regex
  const phonePattern = /\b(\d{3}[-.]?\d{3}[-.]?\d{4}|\(\d{3}\)\s*\d{3}[-.]?\d{4})\b/g;
  const matches = html.match(phonePattern);
  return matches ? Array.from(new Set(matches)) : [];
}

function extractServiceTypes(html: string): string[] {
  // Detect service keywords
  const serviceKeywords = [
    'respite', 'support group', 'counseling', 'crisis', 'financial',
    'medicare', 'legal', 'navigation', 'equipment', 'training', 'caregiver support'
  ];

  const found = serviceKeywords.filter(keyword =>
    html.toLowerCase().includes(keyword)
  );

  return found;
}

function detectCoverage(html: string): 'national' | 'state' | 'county' | 'zip' | 'radius' {
  const lowerHtml = html.toLowerCase();

  if (lowerHtml.includes('nationwide') || lowerHtml.includes('all 50 states')) {
    return 'national';
  }
  if (lowerHtml.includes('statewide') || /\b[A-Z]{2}\b/.test(html)) {
    return 'state';
  }
  if (lowerHtml.includes('county')) {
    return 'county';
  }
  if (/\b\d{5}\b/.test(html)) {
    return 'zip';
  }

  return 'radius';
}

/**
 * Categorize service types to pressure zones
 */
export const categorizeServices = tool({
  name: 'categorizeServices',
  description: 'Map service types to pressure zones using GiveCare taxonomy. Takes service types and returns corresponding pressure zones.',
  parameters: z.object({
    serviceTypes: z.array(z.enum(SERVICE_TYPES as unknown as [string, ...string[]])).describe('Array of service types to categorize'),
  }),
  execute: async ({ serviceTypes }) => {
    try {
      logger.info('Categorizing services', { serviceTypes });

      const zones = mapServicesToZones(serviceTypes);

      logger.info('Categorization complete', { serviceTypes, zones });

      return {
        success: true,
        serviceTypes,
        zones,
        mappingCount: zones.length,
      };

    } catch (error) {
      logger.error('Categorization failed', { serviceTypes, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Validate and normalize phone number to E.164 format
 */
export const validatePhone = tool({
  name: 'validatePhone',
  description: 'Validate a phone number and normalize to E.164 format (+1XXXXXXXXXX for US).',
  parameters: z.object({
    phone: z.string().describe('Phone number to validate'),
  }),
  execute: async ({ phone }) => {
    try {
      logger.info('Validating phone', { phone });

      const normalized = normalizePhoneE164(phone);

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
        } catch {
          accessible = false;
        }
      }

      return {
        valid: true,
        url,
        isSecure,
        accessible,
        statusCode,
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
 * Calculate quality score for a resource
 */
export const checkQuality = tool({
  name: 'checkQuality',
  description: 'Calculate quality score (0-100) based on completeness, validation, and credibility.',
  parameters: z.object({
    hasTitle: z.boolean().describe('Has title'),
    hasProvider: z.boolean().describe('Has provider name'),
    hasPhone: z.boolean().describe('Has valid phone'),
    hasWebsite: z.boolean().describe('Has valid website'),
    hasDescription: z.boolean().describe('Has description'),
    websiteAccessible: z.boolean().optional().nullable().describe('Website is accessible'),
    phoneValid: z.boolean().optional().nullable().describe('Phone is valid E.164'),
    isGovSource: z.boolean().optional().nullable().describe('Source is .gov domain'),
  }),
  execute: async ({ hasTitle, hasProvider, hasPhone, hasWebsite, hasDescription, websiteAccessible, phoneValid, isGovSource }) => {
    try {
      logger.info('Calculating quality score');

      let score = 0;

      // Completeness (50 points)
      if (hasTitle) score += 10;
      if (hasProvider) score += 10;
      if (hasPhone) score += 10;
      if (hasWebsite) score += 10;
      if (hasDescription) score += 10;

      // Validation (30 points)
      if (websiteAccessible) score += 15;
      if (phoneValid) score += 15;

      // Credibility (20 points)
      if (isGovSource) score += 20;

      // Clamp to 0-100
      score = Math.max(0, Math.min(100, score));

      logger.info('Quality score calculated', { score });

      return {
        score,
        breakdown: {
          completeness: (hasTitle ? 10 : 0) + (hasProvider ? 10 : 0) + (hasPhone ? 10 : 0) + (hasWebsite ? 10 : 0) + (hasDescription ? 10 : 0),
          validation: (websiteAccessible ? 15 : 0) + (phoneValid ? 15 : 0),
          credibility: isGovSource ? 20 : 0,
        },
      };

    } catch (error) {
      logger.error('Quality check failed', { error });
      return {
        score: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Export all extraction tools (including categorization and validation)
export const extractionTools = [
  fetchPage,
  extractStructured,
  parsePagination,
  categorizeServices,
  validatePhone,
  validateURL,
  checkQuality,
];
