#!/usr/bin/env tsx
/**
 * Main CLI script to run instruction optimization
 *
 * Usage:
 *   npm run optimize -- --agent main --iterations 5
 *   npm run optimize -- --agent crisis --dataset ./custom-dataset.jsonl
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatasetLoader } from './dataset-loader';
import { InstructionOptimizer } from './optimize-instructions';
import { mainInstructions, crisisInstructions, assessmentInstructions } from '../src/instructions';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

interface CLIArgs {
  agent: 'main' | 'crisis' | 'assessment';
  dataset?: string;
  iterations: number;
  sampleSize: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: any = {
    agent: 'main',
    iterations: 5,
    sampleSize: 50,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === '--agent' && next) {
      parsed.agent = next;
      i++;
    } else if (arg === '--dataset' && next) {
      parsed.dataset = next;
      i++;
    } else if (arg === '--iterations' && next) {
      parsed.iterations = parseInt(next, 10);
      i++;
    } else if (arg === '--sample' && next) {
      parsed.sampleSize = parseInt(next, 10);
      i++;
    }
  }

  return parsed as CLIArgs;
}

/**
 * Extract base instruction for agent type
 */
function getBaseInstruction(agentType: 'main' | 'crisis' | 'assessment'): string {
  // Create mock context for instruction generation
  const mockContext: any = {
    context: {
      firstName: 'there',
      relationship: 'caregiver',
      careRecipientName: 'your loved one',
      journeyPhase: 'active',
      burnoutScore: null,
      burnoutBand: null,
      pressureZones: [],
      assessmentType: null,
      assessmentCurrentQuestion: 0,
      assessmentResponses: {},
      onboardingAttempts: {},
    },
  };

  switch (agentType) {
    case 'main':
      return mainInstructions(mockContext);
    case 'crisis':
      return crisisInstructions(mockContext);
    case 'assessment':
      return assessmentInstructions(mockContext);
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

/**
 * Main optimization function
 */
async function main() {
  console.log('🧠 GiveCare Agent Instruction Optimizer\n');

  // Parse arguments
  const args = parseArgs();
  console.log('Configuration:');
  console.log(`- Agent type: ${args.agent}`);
  console.log(`- Iterations: ${args.iterations}`);
  console.log(`- Sample size: ${args.sampleSize}\n`);

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.error('Please set it in .env.local file');
    process.exit(1);
  }

  // Load dataset
  const datasetPath = args.dataset || resolve(__dirname, '../evals/data/gc_set_0925v1.jsonl');
  console.log(`📂 Loading dataset from: ${datasetPath}`);

  const loader = new DatasetLoader(datasetPath);
  const allExamples = loader.load();

  // Get dataset summary
  const summary = loader.getSummary();
  console.log('\n📊 Dataset Summary:');
  console.log(`Total examples: ${summary.total}`);
  console.log(`Categories: ${Object.keys(summary.categories).length}`);
  console.log(`Trauma principles covered: ${Object.keys(summary.principles).join(', ')}\n`);

  // Sample examples for optimization
  const examples = loader.sample(args.sampleSize);
  console.log(`✅ Using ${examples.length} examples for optimization\n`);

  // Get base instruction
  const baseInstruction = getBaseInstruction(args.agent);
  console.log(`📝 Base instruction length: ${baseInstruction.length} characters\n`);

  // Create optimizer
  const optimizer = new InstructionOptimizer(apiKey, {
    optimizationIterations: args.iterations,
  });

  // Run optimization
  const result = await optimizer.optimize(baseInstruction, examples, args.agent);

  // Save results
  await optimizer.saveResults(result, args.agent);

  // Print final summary
  console.log('\n' + '='.repeat(80));
  console.log('OPTIMIZATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Agent Type: ${args.agent}`);
  console.log(`Baseline Score: ${result.original_score.toFixed(3)}`);
  console.log(`Optimized Score: ${result.optimized_score.toFixed(3)}`);
  console.log(`Improvement: +${result.improvement.toFixed(1)}%`);
  console.log('\nDetailed Metrics:');
  console.log(`- P1 (Acknowledge > Answer > Advance): ${result.metrics.p1.toFixed(3)}`);
  console.log(`- P2 (Never Repeat): ${result.metrics.p2.toFixed(3)}`);
  console.log(`- P3 (Respect Boundaries): ${result.metrics.p3.toFixed(3)}`);
  console.log(`- P4 (Soft Confirmations): ${result.metrics.p4.toFixed(3)}`);
  console.log(`- P5 (Always Offer Skip): ${result.metrics.p5.toFixed(3)}`);
  console.log(`- P6 (Deliver Value): ${result.metrics.p6.toFixed(3)}`);
  console.log(`- SMS Constraint (≤150 chars): ${result.metrics.sms.toFixed(3)}`);
  console.log(`- Forbidden Words: ${result.metrics.forbidden.toFixed(3)}`);
  console.log('='.repeat(80) + '\n');

  console.log('✨ Optimization complete!');
  console.log('📁 Check results/ directory for detailed output');
  console.log('\nNext steps:');
  console.log('1. Review the optimized instruction');
  console.log('2. Test with real user scenarios');
  console.log('3. Deploy to src/instructions.ts if satisfied');
}

// Run
main().catch((error) => {
  console.error('\n❌ Optimization failed:', error);
  process.exit(1);
});
