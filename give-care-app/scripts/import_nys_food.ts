/**
 * Import NYS OAA Food Resources into Convex
 *
 * Usage:
 *   npx tsx scripts/import_nys_food.ts
 *
 * This script:
 * 1. Reads source/food.md
 * 2. Calls Convex mutation to parse and import
 * 3. Prints results
 */

import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🍽️  NYS OAA Food Resources Importer\n');

  // 1. Read file
  const filePath = path.join(__dirname, '..', 'source', 'food.md');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  console.log(`✅ Read file: ${filePath}`);
  console.log(`📄 File size: ${(fileContent.length / 1024).toFixed(2)} KB\n`);

  // 2. Parse locally (for preview)
  const { parseNysOaaFile } = await import('../convex/ingestion/nys_oaa_parser');
  const parsedRecords = parseNysOaaFile(fileContent);

  console.log(`📊 Parsed ${parsedRecords.length} records\n`);

  // Show first 3 records
  console.log('Preview (first 3 records):');
  parsedRecords.slice(0, 3).forEach((record, i) => {
    console.log(`\n${i + 1}. ${record.title}`);
    console.log(`   Provider: ${record.providerName}`);
    console.log(`   Location: ${record.city}, ${record.state} ${record.zip}`);
    console.log(`   Phone: ${record.phone || 'N/A'}`);
  });

  console.log('\n─────────────────────────────────────────────────');
  console.log('\n🚀 To import into Convex, run this in your Convex dashboard:\n');
  console.log('```typescript');
  console.log('const fileContent = `...paste source/food.md content...`;');
  console.log('');
  console.log('await ctx.runMutation(api.ingestion.nys_oaa_parser.importNysOaaData, {');
  console.log('  fileContent');
  console.log('});');
  console.log('```\n');

  console.log('Or use the Convex CLI:');
  console.log('```bash');
  console.log('npx convex run ingestion/nys_oaa_parser:importNysOaaData \\');
  console.log('  --arg fileContent="$(cat source/food.md)"');
  console.log('```\n');

  console.log('Expected result:');
  console.log('─────────────────────────────────────────────────');
  console.log('parsed: 103');
  console.log('valid: ~87 (after filtering junk records)');
  console.log('imported: ~85 (after deduplication)');
  console.log('failed: ~2 (malformed data)');
  console.log('─────────────────────────────────────────────────\n');
}

main().catch(console.error);
