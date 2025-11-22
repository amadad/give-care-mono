/**
 * AI-Powered Intent Interpretation
 * Maps user queries to SDOH zones and generates search strategies
 */

"use node";

import { GoogleGenAI } from "@google/genai";

export interface IntentAnalysis {
  intent: "caregiving" | "personal" | "general" | "emergency";
  sdohZones: string[]; // P1-P6 zones this query relates to
  searchTiers: string[]; // Ordered search refinements (specific → general)
  isGeographical: boolean;
  reasoning: string;
}

/**
 * SDOH Zone Definitions for Context
 */
const SDOH_ZONES = {
  P1: "Emotional Well-being & Social Support - isolation, loneliness, peer support needs",
  P2: "Physical Health - exhaustion, pain, sleep issues, health concerns",
  P3: "Housing & Living Environment - home safety, modifications, accessibility",
  P4: "Economic Stability & Financial Resources - costs, benefits, financial aid",
  P5: "Time Management & Care Coordination - scheduling, respite, care navigation",
  P6: "Mental Health & Stress - burnout, anxiety, depression, counseling needs",
};

/**
 * Interpret user query intent and map to SDOH zones
 * Uses Gemini for structured analysis
 */
export async function interpretSearchIntent(
  query: string,
  userContext: {
    zones?: Record<string, number>;
    gcSdohScore?: number;
    metadata?: any;
  }
): Promise<IntentAnalysis> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback to simple classification if no API key
    return fallbackIntentAnalysis(query);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze this user query for a caregiver support application.

User Query: "${query}"

User Context:
${userContext.zones ? `- Current SDOH Zone Scores: ${JSON.stringify(userContext.zones)}` : ""}
${userContext.gcSdohScore ? `- Overall Burnout Score: ${userContext.gcSdohScore}/100` : ""}

SDOH Zone Framework:
${Object.entries(SDOH_ZONES).map(([zone, desc]) => `${zone}: ${desc}`).join('\n')}

Your Task:
1. Classify the intent:
   - "caregiving": Directly related to caregiving duties (respite, support groups, etc.)
   - "personal": Personal wellbeing outside caregiving (hobbies, self-care, travel)
   - "general": General life needs (food, transport, housing)
   - "emergency": Crisis or urgent need

2. Map to relevant SDOH zones (P1-P6) based on what the query addresses

3. Determine if query has geographical context (looking for physical locations)

4. Generate 3 tiered search refinements:
   - Tier 1: Most specific interpretation of the query
   - Tier 2: Broader category with same intent
   - Tier 3: General category as fallback

Return ONLY valid JSON (no markdown):
{
  "intent": "personal",
  "sdohZones": ["P1", "P6"],
  "searchTiers": [
    "quiet coworking spaces for focused work",
    "low-stimulation environments for introverts",
    "mental wellness spaces"
  ],
  "isGeographical": true,
  "reasoning": "Query seeks personal wellbeing resources for managing social energy (P1) and mental health (P6) during travel"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 500,
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      return fallbackIntentAnalysis(query);
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (!text) {
      return fallbackIntentAnalysis(query);
    }

    const result = JSON.parse(text);

    // Validate and return
    if (!result.intent || !result.sdohZones || !result.searchTiers) {
      console.warn("Invalid intent analysis, using fallback");
      return fallbackIntentAnalysis(query);
    }

    return result;
  } catch (error) {
    console.error("Intent interpretation failed:", error);
    return fallbackIntentAnalysis(query);
  }
}

/**
 * Fallback intent analysis (simple keyword matching)
 * Used when Gemini is unavailable
 */
function fallbackIntentAnalysis(query: string): IntentAnalysis {
  const lowerQuery = query.toLowerCase();

  // Simple keyword detection
  const isCaregiving = /respite|caregiver|support group|elder|senior|care|hospice|memory/.test(lowerQuery);
  const isEmergency = /crisis|emergency|urgent|911|help now/.test(lowerQuery);
  const isGeographical = /near|nearby|in |around|local|city|town|zip/.test(lowerQuery);

  // Simple zone mapping
  const zones: string[] = [];
  if (/lonely|isolated|social|friend|group/.test(lowerQuery)) zones.push("P1");
  if (/tired|pain|health|sleep|physical/.test(lowerQuery)) zones.push("P2");
  if (/home|house|safety|modify/.test(lowerQuery)) zones.push("P3");
  if (/money|financial|afford|cost|benefit/.test(lowerQuery)) zones.push("P4");
  if (/time|schedule|busy|overwhelm/.test(lowerQuery)) zones.push("P5");
  if (/stress|anxiety|mental|burnout|depress/.test(lowerQuery)) zones.push("P6");

  return {
    intent: isEmergency ? "emergency" : isCaregiving ? "caregiving" : "general",
    sdohZones: zones.length > 0 ? zones : ["P1"], // Default to P1
    searchTiers: [
      query, // Use query as-is
      query.split(" ").slice(0, 3).join(" "), // First 3 words
      "general resources", // Generic fallback
    ],
    isGeographical,
    reasoning: "Fallback analysis (Gemini unavailable)",
  };
}

/**
 * Get display name for SDOH zone
 */
export function getZoneDisplayName(zone: string): string {
  const names: Record<string, string> = {
    P1: "Social Support",
    P2: "Physical Health",
    P3: "Housing & Environment",
    P4: "Financial Resources",
    P5: "Time & Care Coordination",
    P6: "Mental Health",
  };
  return names[zone] || zone;
}
