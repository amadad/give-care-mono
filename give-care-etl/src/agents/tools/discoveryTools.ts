"use node";

/**
 * Discovery Agent Tools
 *
 * Tools for finding and evaluating authoritative sources
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import Exa from 'exa-js';
import { createLogger } from '../../utils/logger';

const logger = createLogger({ agentName: 'discovery-tools' });

/**
 * Search web for caregiver resources using Exa API
 */
export const searchWeb = tool({
  name: 'searchWeb',
  description: 'Search the web for authoritative caregiver resource sources. Returns ranked URLs with credibility scores.',
  parameters: z.object({
    query: z.string().describe('Search query (e.g., "New York Area Agency on Aging")'),
    state: z.string().optional().describe('State filter (e.g., "NY", "CA")'),
    limit: z.number().default(10).describe('Maximum number of results'),
  }),
  execute: async ({ query, state, limit }, { ctx }) => {
    try {
      // Get Exa API key from environment
      const exaApiKey = (ctx as any).env?.EXA_API_KEY;
      if (!exaApiKey) {
        throw new Error('EXA_API_KEY not configured');
      }

      const exa = new Exa(exaApiKey);

      // Build enhanced query with state filter
      const enhancedQuery = state
        ? `${query} ${state} site:gov OR site:org`
        : `${query} site:gov OR site:org`;

      logger.info('Searching web', { query: enhancedQuery, limit });

      // Search with Exa
      const results = await exa.searchAndContents(enhancedQuery, {
        numResults: limit,
        useAutoprompt: true,
        type: 'neural',
        category: 'reference',
      });

      // Transform results
      const sources = results.results.map((result: any) => ({
        url: result.url,
        title: result.title,
        snippet: result.text?.substring(0, 200),
        publishedDate: result.publishedDate,
        score: result.score,
      }));

      logger.info('Search complete', { resultsCount: sources.length });

      return {
        sources,
        query: enhancedQuery,
        totalResults: sources.length,
      };

    } catch (error) {
      logger.error('Search failed', error);
      throw error;
    }
  },
});

/**
 * Evaluate credibility of a source based on domain, SSL, and authority
 */
export const evaluateSource = tool({
  name: 'evaluateSource',
  description: 'Evaluate the credibility of a source URL. Returns a score from 0-100.',
  parameters: z.object({
    url: z.string().describe('URL to evaluate'),
  }),
  execute: async ({ url }) => {
    try {
      logger.info('Evaluating source', { url });

      const domain = new URL(url).hostname;
      let score = 50; // Base score

      // Government domains get highest credibility
      if (domain.endsWith('.gov')) {
        score = 95;
        if (domain.includes('eldercare') || domain.includes('aging')) {
          score = 100;
        }
      }
      // .org domains (nonprofits)
      else if (domain.endsWith('.org')) {
        score = 75;
        // Well-known nonprofits
        const trusted = ['aarp.org', 'alzheimers.org', 'caregiver.org', 'agingcare.org'];
        if (trusted.some(t => domain.includes(t))) {
          score = 90;
        }
      }
      // .edu domains (universities)
      else if (domain.endsWith('.edu')) {
        score = 80;
      }
      // Commercial (.com, .net)
      else {
        score = 40;
      }

      // Check for HTTPS
      if (url.startsWith('https://')) {
        score += 5;
      }

      // Check if URL is accessible (HEAD request)
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          score -= 20; // Penalize inaccessible sources
        }
      } catch {
        score -= 30; // Heavily penalize unreachable sources
      }

      // Clamp score to 0-100
      score = Math.max(0, Math.min(100, score));

      logger.info('Source evaluated', { url, score });

      return {
        url,
        domain,
        credibilityScore: score,
        tier: score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low',
      };

    } catch (error) {
      logger.error('Evaluation failed', { url, error });
      return {
        url,
        credibilityScore: 0,
        tier: 'low',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Rank sources by credibility and relevance
 */
export const rankSources = tool({
  name: 'rankSources',
  description: 'Rank a list of sources by credibility score. Returns sorted list with top sources first.',
  parameters: z.object({
    sources: z.array(z.object({
      url: z.string(),
      credibilityScore: z.number(),
    })).describe('Array of sources with credibility scores'),
    limit: z.number().default(10).describe('Maximum number of sources to return'),
  }),
  execute: async ({ sources, limit }) => {
    logger.info('Ranking sources', { totalSources: sources.length, limit });

    // Sort by credibility score descending
    const ranked = sources
      .sort((a, b) => b.credibilityScore - a.credibilityScore)
      .slice(0, limit);

    logger.info('Sources ranked', {
      topScore: ranked[0]?.credibilityScore,
      lowestScore: ranked[ranked.length - 1]?.credibilityScore,
    });

    return {
      rankedSources: ranked,
      totalRanked: ranked.length,
      averageScore: ranked.reduce((sum, s) => sum + s.credibilityScore, 0) / ranked.length,
    };
  },
});

// Export all discovery tools
export const discoveryTools = [
  searchWeb,
  evaluateSource,
  rankSources,
];
