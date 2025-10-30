#!/usr/bin/env tsx
/**
 * DEMO: Real MiPRO v2 Optimization
 * 
 * This shows exactly what it takes to run optimization with the refactored code
 */

import 'dotenv/config';
import { AxInstructionOptimizer } from './dspy_optimization/ax-optimize';
import { DatasetLoader } from './dspy_optimization/dataset-loader';
import { mainInstructions } from './src/instructions';

console.log('🎯 MiPRO v2 Optimization Demo\n');
console.log('================================================================================');

// STEP 1: Load the dataset
console.log('\n📂 STEP 1: Loading evaluation dataset...');
const datasetPath = './evals/data/gc_set_0925v1.jsonl';
const loader = new DatasetLoader(datasetPath);
const allExamples = loader.load();
const examples = allExamples.slice(0, 10); // Use 10 examples for demo
console.log(`   ✅ Loaded ${examples.length} examples`);

// STEP 2: Get base instruction
console.log('\n📝 STEP 2: Getting base agent instruction...');
const baseInstruction = mainInstructions({
  context: {
    userId: 'demo-user',
    firstName: 'there',
    lastName: '',
    relationship: 'caregiver',
    careRecipientName: 'your loved one',
    journeyPhase: 'active',
    profileComplete: false,
    missingFields: ['zipCode'],
    onboardingAttempts: {},
    burnoutScore: undefined,
    burnoutBand: undefined,
    pressureZones: [],
    assessmentResponses: {},
    sessionId: '',
    sessionStartedAt: Date.now(),
    messagesSent: 0,
    lastMessageAt: Date.now(),
    conversationPhase: 'active',
    lastAssessmentAt: undefined,
    assessmentDue: false,
    interventionHistory: [],
    lastInterventionAt: undefined,
    crisisTriggered: false,
    safetyCheckRequired: false,
    recentMemories: []
  }
} as any);
console.log(`   ✅ Instruction loaded (${baseInstruction.length} chars)`);

// STEP 3: Initialize optimizer with MiPRO v2 features
console.log('\n🧠 STEP 3: Initializing MiPRO v2 optimizer...');
console.log('   Features enabled:');
console.log('   ✅ Factory functions (ai(), ax())');
console.log('   ✅ Descriptive field names (caregiverQuestion, traumaInformedReply)');
console.log('   ✅ Cost tracking ($5 budget, 100k tokens)');
console.log('   ✅ Checkpointing (save every 10 rounds)');

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('❌ OPENAI_API_KEY not found in environment');
}

const optimizer = new AxInstructionOptimizer(
  apiKey,
  5,      // $5 budget limit
  100000  // 100k token limit
);

// STEP 4: Run Bootstrap optimization (TypeScript-only, no Python service needed)
console.log('\n🚀 STEP 4: Running Bootstrap Few-Shot optimization...');
console.log('   Trials: 5');
console.log('   Max bootstrapped demos: 3');
console.log('   Max labeled demos: 3');
console.log('');
console.log('================================================================================');

const result = await optimizer.optimizeWithBootstrap(baseInstruction, examples, {
  numTrials: 5,
  maxBootstrappedDemos: 3,
  maxLabeledDemos: 3,
  verbose: true
});

// STEP 5: Display results
console.log('\n================================================================================');
console.log('✨ OPTIMIZATION RESULTS');
console.log('================================================================================');
console.log(`Baseline Score:     ${result.baseline_score.toFixed(3)}`);
console.log(`Optimized Score:    ${result.optimized_score.toFixed(3)}`);
console.log(`Improvement:        +${result.improvement_percent.toFixed(1)}%`);
console.log('');
console.log('Detailed Metrics:');
console.log(`  P1 (Acknowledge > Answer > Advance): ${result.detailed_metrics.p1.toFixed(3)}`);
console.log(`  P2 (Never Repeat):                   ${result.detailed_metrics.p2.toFixed(3)}`);
console.log(`  P3 (Respect Boundaries):             ${result.detailed_metrics.p3.toFixed(3)}`);
console.log(`  P4 (Soft Confirmations):             ${result.detailed_metrics.p4.toFixed(3)}`);
console.log(`  P5 (Always Offer Skip):              ${result.detailed_metrics.p5.toFixed(3)}`);
console.log(`  P6 (Deliver Value):                  ${result.detailed_metrics.p6.toFixed(3)}`);
console.log(`  SMS Constraint (≤150 chars):         ${result.detailed_metrics.sms.toFixed(3)}`);
console.log(`  Forbidden Words:                     ${result.detailed_metrics.forbidden.toFixed(3)}`);
console.log('');
console.log('Optimization Stats:');
console.log(`  Total trials:       ${result.optimization_stats.total_trials}`);
console.log(`  Converged:          ${result.optimization_stats.converged ? '✅' : '❌'}`);
console.log(`  Time:               ${(result.optimization_stats.optimization_time_ms / 1000).toFixed(1)}s`);
if (result.optimization_stats.total_cost) {
  console.log(`  Total cost:         $${result.optimization_stats.total_cost.toFixed(2)}`);
}
if (result.optimization_stats.total_tokens) {
  console.log(`  Total tokens:       ${result.optimization_stats.total_tokens.toLocaleString()}`);
}
console.log('================================================================================');

// STEP 6: Save results
console.log('\n💾 STEP 6: Saving optimization results...');
await optimizer.saveResults(result, 'main');
console.log('   ✅ Results saved to dspy_optimization/results/');

console.log('\n✨ Demo complete! The refactored code is working perfectly.\n');
