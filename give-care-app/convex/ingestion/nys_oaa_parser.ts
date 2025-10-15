/**
 * Parser for NYS Office for the Aging (OAA) Food Resources
 *
 * Transforms semi-structured text from source/food.md into normalized database records.
 *
 * Example input:
 * ```
 * LUNCH CLUB 60 - Clyde Site
 *
 * There are six Lunch Club 60 locations in Wayne County...
 *
 * Provider:Wayne County Department of Aging and Youth
 * Address: Health Services Building, 1519 Nye Road, Suite 300, Lyons, NY, 14489
 * Telephone: (315)-946-5624
 * Email: aging@co.wayne.ny.us
 * ```
 *
 * Output: Normalized provider/program/facility/serviceArea/resource records
 */


import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// ============================================================================
// STEP 1: PARSE RAW TEXT
// ============================================================================

interface ParsedRecord {
  title: string;
  description: string;
  providerName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
}

/**
 * Parse semi-structured text into individual records
 */
export function parseNysOaaFile(fileContent: string): ParsedRecord[] {
  const records: ParsedRecord[] = [];

  // Split by double newline (each record is separated by blank line)
  const sections = fileContent.split(/\n\n+/);

  let currentRecord: Partial<ParsedRecord> = {};

  for (const section of sections) {
    const lines = section.trim().split('\n');

    // First line is usually the title (unless it's a field label)
    if (lines[0] && !lines[0].includes(':')) {
      // Save previous record if exists
      if (currentRecord.title) {
        records.push(currentRecord as ParsedRecord);
      }

      // Start new record
      currentRecord = {
        title: lines[0].trim(),
        description: '',
        providerName: null,
        address: null,
        city: null,
        state: null,
        zip: null,
        phone: null,
        fax: null,
        email: null,
        website: null
      };

      // Rest is description (until we hit field labels)
      const descLines: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes(':')) break;
        descLines.push(lines[i].trim());
      }
      currentRecord.description = descLines.join(' ').trim();
    }

    // Parse field labels
    for (const line of lines) {
      if (line.includes('Provider:')) {
        currentRecord.providerName = line.split('Provider:')[1]?.trim() || null;
      } else if (line.includes('Address:')) {
        const addrText = line.split('Address:')[1]?.trim() || '';
        const parsed = parseAddress(addrText);
        currentRecord.address = parsed.street;
        currentRecord.city = parsed.city;
        currentRecord.state = parsed.state;
        currentRecord.zip = parsed.zip;
      } else if (line.includes('Telephone:')) {
        currentRecord.phone = line.split('Telephone:')[1]?.trim() || null;
      } else if (line.includes('Fax:')) {
        currentRecord.fax = line.split('Fax:')[1]?.trim() || null;
      } else if (line.includes('Email:')) {
        currentRecord.email = line.split('Email:')[1]?.trim() || null;
      } else if (line.includes('Website:')) {
        currentRecord.website = line.split('Website:')[1]?.trim() || null;
      }
    }
  }

  // Save last record
  if (currentRecord.title) {
    records.push(currentRecord as ParsedRecord);
  }

  return records.filter(r => r.title && r.providerName); // Filter incomplete records
}

function parseAddress(addressText: string): {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
} {
  // Example: "Health Services Building1519 Nye Road, Suite 300, Lyons, NY, 14489-"
  // Pattern: [Street], [City], [State], [ZIP]

  const parts = addressText.split(',').map(p => p.trim());

  if (parts.length < 3) {
    return { street: addressText, city: null, state: null, zip: null };
  }

  // Last part usually has state and ZIP
  const lastPart = parts[parts.length - 1];
  const zipMatch = lastPart.match(/\b(\d{5})(-\d{4})?\b/);
  const zip = zipMatch ? zipMatch[1] : null;

  // State is usually 2 letters before ZIP or in second-to-last part
  const stateMatch = addressText.match(/\b([A-Z]{2})\b/);
  const state = stateMatch ? stateMatch[1] : 'NY'; // Default to NY

  // City is second-to-last part (or last if no ZIP)
  const city = parts.length >= 2 ? parts[parts.length - 2] : null;

  // Street is everything before city
  const street = parts.slice(0, -2).join(', ');

  return { street, city, state, zip };
}

// ============================================================================
// STEP 2: CATEGORIZE & MAP TO PRESSURE ZONES
// ============================================================================

interface CategorizedRecord extends ParsedRecord {
  resourceCategory: string[];
  pressureZones: string[];
  eligibility: string | null;
}

function categorizeRecord(record: ParsedRecord): CategorizedRecord {
  const categories: string[] = [];
  const zones: string[] = [];

  const text = (record.title + ' ' + record.description).toLowerCase();

  // Food-related categories
  if (text.includes('food pantry') || text.includes('emergency food')) {
    categories.push('financial_assistance'); // Food is a financial concern
    zones.push('financial_concerns');
  }

  if (text.includes('meal') || text.includes('lunch') || text.includes('dinner') || text.includes('breakfast')) {
    categories.push('caregiver_support'); // Meals = respite from cooking
    zones.push('time_management', 'physical_health');
  }

  if (text.includes('home delivered') || text.includes('meals on wheels')) {
    categories.push('navigation'); // Requires coordination
    zones.push('time_management', 'physical_health');
  }

  if (text.includes('senior') || text.includes('60+') || text.includes('age 60')) {
    // Already age-appropriate
  }

  if (text.includes('caregiver')) {
    categories.push('caregiver_support');
    zones.push('emotional_wellbeing', 'social_support');
  }

  // Default if nothing matched
  if (categories.length === 0) {
    categories.push('navigation');
    zones.push('financial_concerns');
  }

  // Extract eligibility
  let eligibility: string | null = null;
  if (text.includes('60+') || text.includes('age 60')) {
    eligibility = 'Age 60+, caregivers of older adults';
  } else if (text.includes('low-income') || text.includes('homeless')) {
    eligibility = 'Low-income individuals and families';
  } else if (text.includes('no income restriction')) {
    eligibility = 'Open to all';
  }

  return {
    ...record,
    resourceCategory: [...new Set(categories)], // Deduplicate
    pressureZones: [...new Set(zones)],
    eligibility
  };
}

// ============================================================================
// STEP 3: NORMALIZE & LOAD
// ============================================================================

function normalizePhone(phone: string | null): string | undefined {
  if (!phone) return undefined;

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }

  return undefined; // Invalid
}

function normalizeUrl(url: string | null): string | undefined {
  if (!url || url === 'N/A' || url.trim() === '') return undefined;

  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    new URL(normalized); // Validate
    return normalized;
  } catch {
    return undefined;
  }
}

function inferSector(providerName: string): string {
  const lower = providerName.toLowerCase();

  if (lower.includes('county') || lower.includes('office for aging')) {
    return 'public_local';
  } else if (lower.includes('state') || lower.includes('new york state')) {
    return 'public_state';
  } else if (lower.includes('church') || lower.includes('ministries')) {
    return 'faith_based';
  } else if (lower.includes('ymca') || lower.includes('nonprofit') || lower.includes('community')) {
    return 'nonprofit';
  }

  return 'nonprofit'; // Default
}

// ============================================================================
// STEP 4: CONVEX MUTATION TO LOAD DATA
// ============================================================================

export const importNysOaaData = internalMutation({
  args: {
    fileContent: v.string()
  },
  handler: async (ctx, { fileContent }) => {
    // 1. Parse file
    const parsedRecords = parseNysOaaFile(fileContent);
    console.log(`Parsed ${parsedRecords.length} records from NYS OAA file`);

    // 2. Categorize
    const categorizedRecords = parsedRecords.map(categorizeRecord);

    // 3. Filter out junk records
    const validRecords = categorizedRecords.filter(r => {
      // Skip if no ZIP code (can't geolocate)
      if (!r.zip) return false;

      // Skip if title suggests it's not a resource
      const junkKeywords = ['emergency operations', 'environmental projects', 'skilled nurses'];
      if (junkKeywords.some(keyword => r.title.toLowerCase().includes(keyword))) {
        return false;
      }

      return true;
    });

    console.log(`Filtered to ${validRecords.length} valid records`);

    // 4. Load into database
    const results = [];
    const now = Date.now();

    for (const record of validRecords) {
      try {
        // Check if provider already exists
        const existingProvider = await ctx.db
          .query("providers")
          .withIndex("by_name", q => q.eq("name", record.providerName!))
          .first();

        let providerId;
        if (existingProvider) {
          providerId = existingProvider._id;
        } else {
          // Create provider
          providerId = await ctx.db.insert("providers", {
            name: record.providerName!,
            sector: inferSector(record.providerName!),
            operatorUrl: normalizeUrl(record.website),
            license: "NYS Office for the Aging (OAA) data",
            notes: `Imported from NYS OAA food resources on ${new Date().toISOString()}`,
            tosAllowsScrape: undefined,
            robotsAllowed: undefined,
            createdAt: now,
            updatedAt: now
          });
        }

        // Create facility
        const facilityId = await ctx.db.insert("facilities", {
          providerId,
          name: record.providerName!, // Often same as provider
          phoneE164: normalizePhone(record.phone),
          email: record.email || undefined,
          address: record.address || undefined,
          zip: record.zip || undefined,
          geo: undefined, // Would need geocoding API
          hours: undefined,
          languages: ["en"],
          createdAt: now,
          updatedAt: now
        });

        // Create program
        const programId = await ctx.db.insert("programs", {
          providerId,
          name: record.title,
          description: record.description || undefined,
          resourceCategory: record.resourceCategory,
          pressureZones: record.pressureZones,
          fundingSource: "NYS Office for the Aging / Federal grants",
          eligibility: record.eligibility || "Contact provider for details",
          languageSupport: ["en"],
          createdAt: now,
          updatedAt: now
        });

        // Create service area (county-level based on address)
        const serviceAreaId = await ctx.db.insert("serviceAreas", {
          programId,
          type: "county",
          geoCodes: [record.zip!.slice(0, 3)], // Use ZIP3 as proxy for county
          jurisdictionLevel: "county",
          createdAt: now,
          updatedAt: now
        });

        // Create resource
        const resourceId = await ctx.db.insert("resources", {
          programId,
          facilityId,
          primaryUrl: normalizeUrl(record.website) || undefined,
          dataSourceType: "manual_entry", // Since we're parsing a file
          aggregatorSource: "nys_oaa",
          verificationStatus: "unverified",
          jurisdictionLevel: "county",
          license: "NYS Office for the Aging (OAA) data",
          lastCrawledAt: now,
          createdAt: now,
          updatedAt: now
        });

        results.push({
          provider: record.providerName,
          program: record.title,
          providerId,
          facilityId,
          programId,
          resourceId,
          categories: record.resourceCategory,
          zones: record.pressureZones
        });

      } catch (error) {
        console.error(`Failed to import ${record.title}:`, error);
        results.push({
          provider: record.providerName,
          program: record.title,
          error: String(error)
        });
      }
    }

    return {
      parsed: parsedRecords.length,
      valid: validRecords.length,
      imported: results.filter(r => !("error" in r)).length,
      failed: results.filter(r => "error" in r).length,
      details: results
    };
  }
});

// ============================================================================
// STEP 5: USAGE EXAMPLE
// ============================================================================

/**
 * To use this parser:
 *
 * 1. Read the file in Node.js:
 * ```typescript
 * import fs from 'fs';
 * const fileContent = fs.readFileSync('source/food.md', 'utf-8');
 * ```
 *
 * 2. Call the mutation from Convex dashboard:
 * ```typescript
 * await ctx.runMutation(api.ingestion.nys_oaa_parser.importNysOaaData, {
 *   fileContent: fileContent
 * });
 * ```
 *
 * 3. Expected output:
 * ```typescript
 * {
 *   parsed: 103,
 *   valid: 87,
 *   imported: 85,
 *   failed: 2,
 *   details: [
 *     {
 *       provider: "Wayne County Department of Aging",
 *       program: "LUNCH CLUB 60 - Clyde Site",
 *       providerId: "k1a2b3c4...",
 *       categories: ["caregiver_support"],
 *       zones: ["time_management", "physical_health"]
 *     },
 *     // ... more records
 *   ]
 * }
 * ```
 */
