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
  execute: async ({ url, useJavaScript }, { ctx }) => {
    try {
      logger.info('Fetching page', { url, useJavaScript });

      if (useJavaScript) {
        // Use Cloudflare Browser Rendering API for JS-heavy pages
        const browser = (ctx as any).env?.BROWSER;
        if (!browser) {
          throw new Error('Browser binding not configured');
        }

        const response = await browser.fetch(url);
        const html = await response.text();

        return {
          url,
          html,
          length: html.length,
          method: 'browser-rendering',
        };

      } else {
        // Simple fetch for static pages
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
      }

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

      // Use OpenAI to extract structured data
      // NOTE: In production, this would call GPT-4o-mini with llm-scraper-worker
      // For now, return a placeholder structure

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
      const uniqueLinks = [...new Set(nextLinks)];

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

// Helper functions for basic extraction (placeholder until LLM integration)
function extractField(html: string, fieldName: string, selectors: string): string {
  // Simple regex-based extraction (replace with proper HTML parsing in production)
  const pattern = new RegExp(`<[^>]+class=["']${selectors.split(',')[0].replace('.', '')}["'][^>]*>([^<]+)<`, 'i');
  const match = html.match(pattern);
  return match ? match[1].trim() : '';
}

function extractPhones(html: string): string[] {
  // Extract phone numbers using regex
  const phonePattern = /\b(\d{3}[-.]?\d{3}[-.]?\d{4}|\(\d{3}\)\s*\d{3}[-.]?\d{4})\b/g;
  const matches = html.match(phonePattern);
  return matches ? [...new Set(matches)] : [];
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

// Export all extraction tools
export const extractionTools = [
  fetchPage,
  extractStructured,
  parsePagination,
];
