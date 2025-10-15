/**
 * ETL Pipeline Demo - Visual Step-by-Step
 *
 * Shows EXACTLY what happens at each stage of the pipeline with real output
 *
 * Run: npx tsx scripts/demo_etl_pipeline.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// STEP 0: Read Raw File
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════');
console.log('STEP 0: READ RAW FILE');
console.log('═══════════════════════════════════════════════════════════\n');

const filePath = path.join(__dirname, '..', 'source', 'food.md');
const rawContent = fs.readFileSync(filePath, 'utf-8');

console.log('📄 File: source/food.md');
console.log(`📊 Size: ${(rawContent.length / 1024).toFixed(2)} KB`);
console.log(`📝 Total characters: ${rawContent.length.toLocaleString()}\n`);

// Show first 500 chars
console.log('First 500 characters:');
console.log('─────────────────────────────────────────────────────────');
console.log(rawContent.slice(0, 500));
console.log('...\n');

// ============================================================================
// STEP 1: PARSE (Extract structured data from text)
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════');
console.log('STEP 1: PARSE - Extract Structured Data');
console.log('═══════════════════════════════════════════════════════════\n');

interface ParsedRecord {
  title: string;
  description: string;
  providerName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

function parseRecords(content: string): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  const sections = content.split(/\n\n+/);

  let currentRecord: Partial<ParsedRecord> = {};

  for (const section of sections) {
    const lines = section.trim().split('\n');

    if (lines[0] && !lines[0].includes(':')) {
      if (currentRecord.title) {
        records.push(currentRecord as ParsedRecord);
      }

      currentRecord = {
        title: lines[0].trim(),
        description: '',
        providerName: null,
        address: null,
        city: null,
        state: null,
        zip: null,
        phone: null,
        email: null,
        website: null
      };

      const descLines: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes(':')) break;
        descLines.push(lines[i].trim());
      }
      currentRecord.description = descLines.join(' ').trim();
    }

    for (const line of lines) {
      if (line.includes('Provider:')) {
        currentRecord.providerName = line.split('Provider:')[1]?.trim() || null;
      } else if (line.includes('Address:')) {
        const addr = line.split('Address:')[1]?.trim() || '';
        const parts = addr.split(',').map(p => p.trim());
        currentRecord.address = addr;
        if (parts.length >= 2) {
          currentRecord.city = parts[parts.length - 2];
          const lastPart = parts[parts.length - 1];
          const zipMatch = lastPart.match(/\b(\d{5})\b/);
          currentRecord.zip = zipMatch ? zipMatch[1] : null;
          currentRecord.state = 'NY';
        }
      } else if (line.includes('Telephone:')) {
        currentRecord.phone = line.split('Telephone:')[1]?.trim() || null;
      } else if (line.includes('Email:')) {
        currentRecord.email = line.split('Email:')[1]?.trim() || null;
      } else if (line.includes('Website:')) {
        currentRecord.website = line.split('Website:')[1]?.trim() || null;
      }
    }
  }

  if (currentRecord.title) {
    records.push(currentRecord as ParsedRecord);
  }

  return records.filter(r => r.title && r.providerName);
}

const parsedRecords = parseRecords(rawContent);

console.log(`✅ Parsed ${parsedRecords.length} records\n`);

// Show first 2 parsed records
console.log('Example Record #1:');
console.log('─────────────────────────────────────────────────────────');
console.log(JSON.stringify(parsedRecords[0], null, 2));
console.log('\nExample Record #2:');
console.log('─────────────────────────────────────────────────────────');
console.log(JSON.stringify(parsedRecords[1], null, 2));
console.log('\n');

// ============================================================================
// STEP 2: TRANSFORM (Normalize & categorize)
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════');
console.log('STEP 2: TRANSFORM - Normalize & Categorize');
console.log('═══════════════════════════════════════════════════════════\n');

interface TransformedRecord extends ParsedRecord {
  phoneE164: string | null;
  websiteNormalized: string | null;
  sector: string;
  resourceCategory: string[];
  pressureZones: string[];
  eligibility: string | null;
}

function transformRecord(record: ParsedRecord): TransformedRecord {
  // Normalize phone
  const normalizePhone = (phone: string | null): string | null => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
    return null;
  };

  // Normalize website
  const normalizeWebsite = (url: string | null): string | null => {
    if (!url || url.trim() === '') return null;
    try {
      const normalized = url.startsWith('http') ? url : `https://${url}`;
      new URL(normalized);
      return normalized;
    } catch {
      return null;
    }
  };

  // Infer sector
  const inferSector = (providerName: string): string => {
    const lower = providerName.toLowerCase();
    if (lower.includes('county') || lower.includes('office for aging')) return 'public_local';
    if (lower.includes('church') || lower.includes('ministries')) return 'faith_based';
    if (lower.includes('ymca') || lower.includes('community')) return 'nonprofit';
    return 'nonprofit';
  };

  // Categorize & map to zones
  const categorize = (title: string, description: string): { categories: string[], zones: string[] } => {
    const text = (title + ' ' + description).toLowerCase();
    const categories: string[] = [];
    const zones: string[] = [];

    if (text.includes('food pantry') || text.includes('emergency food')) {
      categories.push('financial_assistance');
      zones.push('financial_concerns');
    }

    if (text.includes('meal') || text.includes('lunch') || text.includes('dinner')) {
      categories.push('caregiver_support');
      zones.push('time_management', 'physical_health');
    }

    if (text.includes('home delivered') || text.includes('meals on wheels')) {
      categories.push('navigation');
      zones.push('time_management', 'physical_health');
    }

    if (categories.length === 0) {
      categories.push('navigation');
      zones.push('financial_concerns');
    }

    return { categories: [...new Set(categories)], zones: [...new Set(zones)] };
  };

  // Extract eligibility
  const extractEligibility = (description: string): string | null => {
    const lower = description.toLowerCase();
    if (lower.includes('60+') || lower.includes('age 60')) return 'Age 60+, caregivers of older adults';
    if (lower.includes('low-income')) return 'Low-income individuals and families';
    if (lower.includes('no income restriction')) return 'Open to all';
    return null;
  };

  const { categories, zones } = categorize(record.title, record.description);

  return {
    ...record,
    phoneE164: normalizePhone(record.phone),
    websiteNormalized: normalizeWebsite(record.website),
    sector: inferSector(record.providerName || ''),
    resourceCategory: categories,
    pressureZones: zones,
    eligibility: extractEligibility(record.description)
  };
}

const transformedRecords = parsedRecords.map(transformRecord);

console.log('📋 Transformations Applied:\n');
console.log('1. Phone Normalization:');
console.log(`   Before: "${parsedRecords[0].phone}"`);
console.log(`   After:  "${transformedRecords[0].phoneE164}"\n`);

console.log('2. Website Normalization:');
console.log(`   Before: "${parsedRecords[0].website}"`);
console.log(`   After:  "${transformedRecords[0].websiteNormalized}"\n`);

console.log('3. Sector Inference:');
console.log(`   Provider: "${transformedRecords[0].providerName}"`);
console.log(`   Sector:   "${transformedRecords[0].sector}"\n`);

console.log('4. Categorization (Keyword Matching):');
console.log(`   Title: "${transformedRecords[0].title}"`);
console.log(`   Categories: ${JSON.stringify(transformedRecords[0].resourceCategory)}`);
console.log(`   Zones:      ${JSON.stringify(transformedRecords[0].pressureZones)}\n`);

console.log('5. Eligibility Extraction:');
console.log(`   From description: "...${transformedRecords[0].description.slice(0, 100)}..."`);
console.log(`   Eligibility: "${transformedRecords[0].eligibility}"\n`);

// ============================================================================
// STEP 3: FILTER (Remove junk records)
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════');
console.log('STEP 3: FILTER - Remove Junk Records');
console.log('═══════════════════════════════════════════════════════════\n');

const junkKeywords = ['emergency operations', 'environmental projects', 'skilled nurses'];

const validRecords = transformedRecords.filter(record => {
  // Must have ZIP code
  if (!record.zip) {
    console.log(`❌ Filtered out (no ZIP): "${record.title}"`);
    return false;
  }

  // Check for junk keywords
  const titleLower = record.title.toLowerCase();
  for (const keyword of junkKeywords) {
    if (titleLower.includes(keyword)) {
      console.log(`❌ Filtered out (junk keyword): "${record.title}"`);
      return false;
    }
  }

  return true;
});

console.log(`\n✅ Valid records: ${validRecords.length} / ${transformedRecords.length}`);
console.log(`❌ Filtered out: ${transformedRecords.length - validRecords.length}\n`);

// ============================================================================
// STEP 4: LOAD (What would go into database)
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════');
console.log('STEP 4: LOAD - Database Records (Preview)');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('For record: "' + validRecords[0].title + '"\n');

console.log('📦 5 Database Tables Would Be Created:\n');

console.log('1️⃣  providers:');
console.log('─────────────────────────────────────────────────────────');
console.log(JSON.stringify({
  _id: '<generated>',
  name: validRecords[0].providerName,
  sector: validRecords[0].sector,
  operatorUrl: validRecords[0].websiteNormalized,
  license: 'NYS Office for the Aging (OAA) data',
  notes: 'Imported from NYS OAA food resources',
  createdAt: Date.now()
}, null, 2));

console.log('\n2️⃣  facilities:');
console.log('─────────────────────────────────────────────────────────');
console.log(JSON.stringify({
  _id: '<generated>',
  providerId: '<from step 1>',
  name: validRecords[0].providerName,
  phoneE164: validRecords[0].phoneE164,
  email: validRecords[0].email,
  address: validRecords[0].address,
  zip: validRecords[0].zip,
  geo: null,
  languages: ['en'],
  createdAt: Date.now()
}, null, 2));

console.log('\n3️⃣  programs:');
console.log('─────────────────────────────────────────────────────────');
console.log(JSON.stringify({
  _id: '<generated>',
  providerId: '<from step 1>',
  name: validRecords[0].title,
  description: validRecords[0].description.slice(0, 100) + '...',
  resourceCategory: validRecords[0].resourceCategory,
  pressureZones: validRecords[0].pressureZones,
  eligibility: validRecords[0].eligibility,
  createdAt: Date.now()
}, null, 2));

console.log('\n4️⃣  serviceAreas:');
console.log('─────────────────────────────────────────────────────────');
console.log(JSON.stringify({
  _id: '<generated>',
  programId: '<from step 3>',
  type: 'county',
  geoCodes: [validRecords[0].zip!.slice(0, 3)],
  jurisdictionLevel: 'county',
  createdAt: Date.now()
}, null, 2));

console.log('\n5️⃣  resources (joins everything):');
console.log('─────────────────────────────────────────────────────────');
console.log(JSON.stringify({
  _id: '<generated>',
  programId: '<from step 3>',
  facilityId: '<from step 2>',
  primaryUrl: validRecords[0].websiteNormalized,
  dataSourceType: 'manual_entry',
  aggregatorSource: 'nys_oaa',
  verificationStatus: 'unverified',
  lastCrawledAt: Date.now(),
  createdAt: Date.now()
}, null, 2));

// ============================================================================
// STEP 5: MATCHING (How this would surface to a user)
// ============================================================================

console.log('\n\n═══════════════════════════════════════════════════════════');
console.log('STEP 5: MATCHING - How User Sees This Resource');
console.log('═══════════════════════════════════════════════════════════\n');

// Mock user
const mockUser = {
  name: 'Margaret',
  age: 68,
  burnoutBand: 'moderate',
  burnoutScore: 52,
  pressureZones: ['time_management', 'physical_health'],
  zipCode: validRecords[0].zip || '14489'
};

console.log('👤 User Profile:');
console.log('─────────────────────────────────────────────────────────');
console.log(JSON.stringify(mockUser, null, 2));

console.log('\n\n🎯 Matching Algorithm:');
console.log('─────────────────────────────────────────────────────────\n');

// Calculate zone score
const userZones = mockUser.pressureZones;
const resourceZones = validRecords[0].pressureZones;
const zoneOverlap = userZones.filter(z => resourceZones.includes(z)).length;
const zoneScore = zoneOverlap / userZones.length;

console.log('1. Zone Match (40% weight):');
console.log(`   User zones:     ${JSON.stringify(userZones)}`);
console.log(`   Resource zones: ${JSON.stringify(resourceZones)}`);
console.log(`   Overlap:        ${zoneOverlap} / ${userZones.length}`);
console.log(`   Score:          ${zoneScore.toFixed(2)} (${(zoneScore * 100).toFixed(0)}%)\n`);

// Calculate geo score
const geoScore = mockUser.zipCode === validRecords[0].zip ? 1.0 : 0.9;
console.log('2. Geographic Match (30% weight):');
console.log(`   User ZIP:     ${mockUser.zipCode}`);
console.log(`   Resource ZIP: ${validRecords[0].zip}`);
console.log(`   Score:        ${geoScore.toFixed(2)} (${geoScore === 1.0 ? 'exact match' : 'nearby'})\n`);

// Calculate band score
const bandScore = 1.0; // caregiver_support is perfect for moderate
console.log('3. Burnout Band Fit (15% weight):');
console.log(`   User band:        "${mockUser.burnoutBand}"`);
console.log(`   Resource category: ${JSON.stringify(validRecords[0].resourceCategory)}`);
console.log(`   Score:            ${bandScore.toFixed(2)} (perfect fit)\n`);

// Quality score
const qualityScore = 0.44; // unverified, no feedback
console.log('4. Quality Signals (10% weight):');
console.log(`   Verification:  "unverified"`);
console.log(`   RBI score:     null (no feedback yet)`);
console.log(`   Score:         ${qualityScore.toFixed(2)}\n`);

// Freshness
const freshnessScore = 1.0; // just imported
console.log('5. Freshness (5% weight):');
console.log(`   Last verified: Today`);
console.log(`   Score:         ${freshnessScore.toFixed(2)}\n`);

// Final score
const finalScore =
  zoneScore * 0.40 +
  geoScore * 0.30 +
  bandScore * 0.15 +
  qualityScore * 0.10 +
  freshnessScore * 0.05;

console.log('═══════════════════════════════════════════════════════════');
console.log(`FINAL MATCH SCORE: ${finalScore.toFixed(2)} (${(finalScore * 100).toFixed(0)}%)`);
console.log('═══════════════════════════════════════════════════════════\n');

// ============================================================================
// STEP 6: USER EXPERIENCE (What agent sends via SMS)
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════');
console.log('STEP 6: USER EXPERIENCE - SMS Message');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📱 SMS to Margaret:');
console.log('─────────────────────────────────────────────────────────');
console.log(`
Hi Margaret,

Based on your recent check-in, I found a resource that might help with time management and physical health:

🍽️  ${validRecords[0].title}

${validRecords[0].description.slice(0, 150)}...

📍 ${validRecords[0].city}, NY (right in your area!)
📞 ${validRecords[0].phone}
💰 ${validRecords[0].eligibility || 'Contact for details'}

This could give you a break from cooking and a chance to connect with other caregivers. Would you like more details?
`);
console.log('─────────────────────────────────────────────────────────\n');

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════');
console.log('SUMMARY: Complete Pipeline Flow');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📊 Pipeline Statistics:');
console.log(`   Raw file size:      ${(rawContent.length / 1024).toFixed(2)} KB`);
console.log(`   Records parsed:     ${parsedRecords.length}`);
console.log(`   Records transformed: ${transformedRecords.length}`);
console.log(`   Valid records:      ${validRecords.length}`);
console.log(`   Would import:       ${validRecords.length} resources\n`);

console.log('🎯 Match Quality:');
console.log(`   Final score:        ${(finalScore * 100).toFixed(0)}% match`);
console.log(`   Rank:               #1 (would show first to user)\n`);

console.log('✅ Next Steps:');
console.log('   1. Run full import: npx convex run ingestion/nys_oaa_parser:importNysOaaData');
console.log('   2. Verify 10 resources (call facilities)');
console.log('   3. Test with real users');
console.log('   4. Track feedback (RBI scoring)\n');

console.log('═══════════════════════════════════════════════════════════\n');
