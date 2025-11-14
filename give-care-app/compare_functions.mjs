import fs from 'fs';

const local = JSON.parse(fs.readFileSync('function_spec_1763127768149.json', 'utf8'));
const prod = JSON.parse(fs.readFileSync('function_spec_1763127769256.json', 'utf8'));

function getFunctionId(fn) {
  if (fn.functionType === 'HttpAction') {
    return `HTTP ${fn.method} ${fn.path}`;
  }
  return fn.identifier || fn.name || JSON.stringify(fn).slice(0, 50);
}

const localFns = new Set(local.functions.map(getFunctionId));
const prodFns = new Set(prod.functions.map(getFunctionId));

const missingInProd = [...localFns].filter(id => !prodFns.has(id));
const extraInProd = [...prodFns].filter(id => !localFns.has(id));
const common = [...localFns].filter(id => prodFns.has(id));

console.log('=== CONVEX SYNC REPORT ===\n');
console.log(`Local deployment: ${local.url}`);
console.log(`Production deployment: ${prod.url}\n`);
console.log(`Total functions - Local: ${local.functions.length}, Prod: ${prod.functions.length}`);
console.log(`Common functions: ${common.length}\n`);

if (missingInProd.length > 0) {
  console.log(`⚠️  MISSING IN PRODUCTION (${missingInProd.length}):`);
  missingInProd.forEach(id => console.log(`  - ${id}`));
  console.log('');
}

if (extraInProd.length > 0) {
  console.log(`⚠️  EXTRA IN PRODUCTION (${extraInProd.length}):`);
  extraInProd.forEach(id => console.log(`  - ${id}`));
  console.log('');
}

if (missingInProd.length === 0 && extraInProd.length === 0) {
  console.log('✅ Deployments are in sync - no function drift detected\n');
} else {
  console.log('❌ Drift detected - consider deploying to sync\n');
}
