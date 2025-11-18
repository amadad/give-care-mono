"use node";

/**
 * Google Search Grounding for National Resources
 * Used when user has no ZIP code - finds online resources
 *
 * See: https://ai.google.dev/gemini-api/docs/grounding
 */

import { GoogleGenAI } from '@google/genai';

export interface SearchGroundingResult {
  text: string;
  sources: Array<{
    title: string;
    uri: string;
    snippet?: string;
  }>;
  searchQuery: string;
}

const SEARCH_TIMEOUT_MS = 5000; // 5 seconds timeout

/**
 * Search for national/online resources using Google Search Grounding
 * Alternative: Use Gemini's knowledge without grounding
 */
export async function searchWithGemini(
  query: string,
  useSearchGrounding: boolean = false,
  timeoutMs: number = SEARCH_TIMEOUT_MS
): Promise<SearchGroundingResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build search-oriented prompt
  const searchQuery = `Find reliable online resources for: ${query}

Requirements:
- Include specific organizations with their websites
- Prioritize .org, .gov, and established resources
- Provide 3-5 high-quality options
- Include brief descriptions
- Format as numbered list`;

  const config: any = {
    maxOutputTokens: 600,
  };

  // Optional: Enable Google Search Grounding
  // Note: Search Grounding may not be available in all regions/tiers
  if (useSearchGrounding) {
    config.tools = [{ googleSearch: {} }];
  }

  // Timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Search timeout")), timeoutMs);
  });

  const apiPromise = ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: searchQuery,
    config,
  });

  const response = await Promise.race([apiPromise, timeoutPromise]);

  const candidate = response.candidates?.[0];
  if (!candidate) {
    throw new Error("No response candidate from search");
  }

  // Extract text response
  const text = candidate.content?.parts?.[0]?.text ||
    "No resources found. Try being more specific?";

  // Extract grounding sources if available
  const sources: Array<{ title: string; uri: string; snippet?: string }> = [];

  if (useSearchGrounding) {
    const groundingMetadata = candidate.groundingMetadata as any;
    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || 'Untitled',
            uri: chunk.web.uri,
            snippet: chunk.web.snippet,
          });
        }
      });
    }
  }

  return {
    text,
    sources,
    searchQuery: query,
  };
}

/**
 * Tiered search strategy
 * Try multiple search refinements until we get good results
 */
export async function tieredSearch(
  searchTiers: string[],
  useSearchGrounding: boolean = false
): Promise<SearchGroundingResult> {
  let lastError: Error | null = null;

  for (const tier of searchTiers) {
    try {
      const result = await searchWithGemini(tier, useSearchGrounding);

      // Check if we got meaningful results
      if (result.text && result.text.length > 50) {
        return result;
      }
    } catch (error) {
      console.log(`Tier search failed: ${tier}`, error);
      lastError = error as Error;
      continue; // Try next tier
    }
  }

  // All tiers failed
  throw lastError || new Error("All search tiers failed");
}
