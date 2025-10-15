/**
 * Example ETL pipeline for Eldercare Locator data
 *
 * Usage:
 * 1. Run `npx convex dev`
 * 2. Call this mutation from Convex dashboard with raw scraped data
 * 3. Check admin dashboard to verify imported resources
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// ============================================================================
// STEP 1: TRANSFORM RAW DATA
// ============================================================================

interface RawEldercareData {
  name: string;
  address: string;
  phone: string;
  website: string;
  services: string; // Comma-separated
  counties_served: string;
}

interface NormalizedData {
  provider: {
    name: string;
    sector: string;
    operatorUrl?: string;
    license?: string;
    notes?: string;
    tosAllowsScrape?: boolean;
    robotsAllowed?: boolean;
    createdAt: number;
    updatedAt: number;
  };
  programs: Array<{
    name: string;
    description?: string;
    resourceCategory: string[];
    pressureZones: string[];
    fundingSource?: string;
    eligibility?: string;
    languageSupport: string[];
    createdAt: number;
    updatedAt: number;
  }>;
  facility: {
    name: string;
    phoneE164?: string;
    email?: string;
    address?: string;
    zip?: string;
    geo?: { lat: number; lon: number };
    hours?: string;
    languages: string[];
    createdAt: number;
    updatedAt: number;
  };
  serviceArea: {
    type: string;
    geoCodes: string[];
    jurisdictionLevel?: string;
    createdAt: number;
    updatedAt: number;
  };
}

function normalizeEldercareData(raw: RawEldercareData): NormalizedData {
  const now = Date.now();

  return {
    provider: {
      name: cleanOrgName(raw.name),
      sector: inferSector(raw.name),
      operatorUrl: normalizeUrl(raw.website),
      license: "Public Domain (ACL/eldercare.acl.gov)",
      notes: `Imported from Eldercare Locator on ${new Date().toISOString()}`,
      tosAllowsScrape: undefined, // Manual review needed
      robotsAllowed: undefined,
      createdAt: now,
      updatedAt: now
    },

    programs: raw.services.split(",").map((service: string) => {
      const category = mapServiceToCategory(service.trim());
      return {
        name: service.trim(),
        description: undefined,
        resourceCategory: [category],
        pressureZones: mapCategoryToZones([category]),
        fundingSource: "ACL/Older Americans Act",
        eligibility: "Age 60+, caregivers of older adults",
        languageSupport: ["en"],
        createdAt: now,
        updatedAt: now
      };
    }),

    facility: {
      name: raw.name,
      phoneE164: normalizePhone(raw.phone),
      email: undefined,
      address: raw.address,
      zip: extractZip(raw.address),
      geo: undefined, // Would need geocoding API
      hours: undefined,
      languages: ["en"],
      createdAt: now,
      updatedAt: now
    },

    serviceArea: {
      type: "county",
      geoCodes: extractCountyFIPS(raw.counties_served),
      jurisdictionLevel: "county",
      createdAt: now,
      updatedAt: now
    }
  };
}

// ============================================================================
// STEP 2: HELPER FUNCTIONS
// ============================================================================

function cleanOrgName(name: string): string {
  return name
    .replace(/\s+(Inc\.|LLC|Corp\.)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferSector(name: string): string {
  if (/area agency on aging/i.test(name)) return "public_local";
  if (/veterans affairs|VA/i.test(name)) return "va";
  if (/\(501c3\)|nonprofit/i.test(name)) return "nonprofit";
  if (/state unit on aging/i.test(name)) return "public_state";
  return "nonprofit"; // Default assumption for AAAs
}

function normalizeUrl(url: string): string | undefined {
  if (!url || url === "N/A") return undefined;

  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    new URL(normalized); // Validate
    return normalized;
  } catch {
    return undefined;
  }
}

function normalizePhone(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`; // E.164 format
  } else if (digits.length === 11 && digits[0] === "1") {
    return `+${digits}`;
  }

  return undefined;
}

function extractZip(address: string): string | undefined {
  const match = address.match(/\b(\d{5})\b/);
  return match ? match[1] : undefined;
}

function extractCountyFIPS(countiesStr: string): string[] {
  // Simplified mapping (in production, use a lookup table)
  const countyMap: Record<string, string> = {
    "alameda county": "06001",
    "san francisco county": "06075",
    "los angeles county": "06037"
    // ... add more
  };

  const counties = countiesStr.toLowerCase().split(",").map(c => c.trim());
  return counties
    .map(county => countyMap[county])
    .filter((fips): fips is string => fips !== undefined);
}

function mapServiceToCategory(service: string): string {
  const keywords: Record<string, string> = {
    "respite": "respite",
    "support group": "caregiver_support",
    "counseling": "counseling",
    "training": "education_training",
    "equipment": "equipment_devices",
    "legal": "legal_planning",
    "financial": "financial_assistance",
    "navigator": "navigation",
    "case management": "navigation",
    "adult day": "respite"
  };

  const lower = service.toLowerCase();
  for (const [keyword, category] of Object.entries(keywords)) {
    if (lower.includes(keyword)) {
      return category;
    }
  }

  return "navigation"; // Default
}

function mapCategoryToZones(categories: string[]): string[] {
  const mapping: Record<string, string[]> = {
    "respite": ["time_management", "physical_health"],
    "caregiver_support": ["social_support", "emotional_wellbeing"],
    "counseling": ["emotional_wellbeing"],
    "education_training": ["time_management", "emotional_wellbeing"],
    "navigation": ["financial_concerns", "social_support"],
    "equipment_devices": ["physical_health", "financial_concerns"],
    "legal_planning": ["financial_concerns"],
    "financial_assistance": ["financial_concerns"]
  };

  return [...new Set(categories.flatMap(cat => mapping[cat] || []))];
}

// ============================================================================
// STEP 3: LOAD INTO DATABASE
// ============================================================================

export const importEldercareData = internalMutation({
  args: {
    rawData: v.array(v.object({
      name: v.string(),
      address: v.string(),
      phone: v.string(),
      website: v.string(),
      services: v.string(),
      counties_served: v.string()
    }))
  },
  handler: async (ctx, { rawData }) => {
    const results = [];

    for (const raw of rawData) {
      try {
        const normalized = normalizeEldercareData(raw);

        // Check if provider already exists (deduplication)
        const existingProvider = await ctx.db
          .query("providers")
          .withIndex("by_name", q => q.eq("name", normalized.provider.name))
          .first();

        let providerId;
        if (existingProvider) {
          providerId = existingProvider._id;
          console.log(`Provider already exists: ${normalized.provider.name}`);
        } else {
          // Create provider
          providerId = await ctx.db.insert("providers", normalized.provider);
        }

        // Create facility
        const facilityId = await ctx.db.insert("facilities", {
          ...normalized.facility,
          providerId
        });

        // Create programs
        const programIds = await Promise.all(
          normalized.programs.map(program =>
            ctx.db.insert("programs", {
              ...program,
              providerId
            })
          )
        );

        // Create service areas (one per program)
        await Promise.all(
          programIds.map(programId =>
            ctx.db.insert("serviceAreas", {
              ...normalized.serviceArea,
              programId
            })
          )
        );

        // Create resource records
        const resourceIds = await Promise.all(
          programIds.map(programId =>
            ctx.db.insert("resources", {
              programId,
              facilityId,
              primaryUrl: normalized.provider.operatorUrl || undefined,
              dataSourceType: "scraped",
              aggregatorSource: "eldercare_locator",
              verificationStatus: "unverified",
              tosAllowsScrape: normalized.provider.tosAllowsScrape || undefined,
              robotsAllowed: normalized.provider.robotsAllowed || undefined,
              license: normalized.provider.license,
              lastCrawledAt: Date.now(),
              scoreRbi: undefined,
              createdAt: Date.now(),
              updatedAt: Date.now()
            })
          )
        );

        results.push({
          provider: normalized.provider.name,
          providerId,
          facilityId,
          programCount: programIds.length,
          resourceIds
        });

      } catch (error) {
        console.error(`Failed to import ${raw.name}:`, error);
        results.push({
          provider: raw.name,
          error: String(error)
        });
      }
    }

    return {
      imported: results.filter(r => !("error" in r)).length,
      failed: results.filter(r => "error" in r).length,
      details: results
    };
  }
});

// ============================================================================
// STEP 4: EXAMPLE USAGE
// ============================================================================

/**
 * Example call from Convex dashboard:
 *
 * await ctx.runMutation(api.ingestion.eldercare_scraper.importEldercareData, {
 *   rawData: [
 *     {
 *       name: "Area Agency on Aging of Alameda County",
 *       address: "6955 Foothill Blvd, Ste 300, Oakland, CA 94605",
 *       phone: "(510) 577-3530",
 *       website: "http://www.alamedasocialservices.org",
 *       services: "Respite care, Caregiver support groups, Adult day care",
 *       counties_served: "Alameda County"
 *     },
 *     {
 *       name: "San Francisco Institute on Aging",
 *       address: "3575 Geary Blvd, San Francisco, CA 94118",
 *       phone: "(415) 750-4111",
 *       website: "https://www.ioaging.org",
 *       services: "Caregiver support groups, Training, Navigation",
 *       counties_served: "San Francisco County"
 *     }
 *   ]
 * });
 *
 * Result:
 * {
 *   imported: 2,
 *   failed: 0,
 *   details: [
 *     {
 *       provider: "Area Agency on Aging of Alameda County",
 *       providerId: "k1a2b3c4...",
 *       facilityId: "f5d6e7f8...",
 *       programCount: 3,
 *       resourceIds: ["r9g0h1i2...", "r3j4k5l6...", "r7m8n9o0..."]
 *     },
 *     { ... }
 *   ]
 * }
 */
