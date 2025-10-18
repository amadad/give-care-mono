#!/usr/bin/env tsx
/**
 * AX-LLM Orthodox Optimization Runner
 *
 * Supports:
 * - MIPROv2: Multi-stage instruction + demo optimization
 * - GEPA: Multi-objective Pareto optimization
 */

import 'dotenv/config';
import { AxInstructionOptimizer } from './ax-optimize';
import { DatasetLoader } from './dataset-loader';
import { mainInstructions } from '../src/instructions';

interface CLIOptions {
  agent: 'main' | 'crisis' | 'assessment';
  optimizer: 'bootstrap' | 'mipro' | 'gepa';
  trials?: number;
  candidates?: number;
  sample?: number;
}

async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    agent: 'main',
    optimizer: 'bootstrap',  // TypeScript-only, no Python backend needed
    trials: 10,
    candidates: 5,
    sample: 50
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agent' && args[i + 1]) {
      options.agent = args[i + 1] as CLIOptions['agent'];
    }
    if (args[i] === '--optimizer' && args[i + 1]) {
      options.optimizer = args[i + 1] as CLIOptions['optimizer'];
    }
    if (args[i] === '--trials' && args[i + 1]) {
      options.trials = parseInt(args[i + 1]);
    }
    if (args[i] === '--candidates' && args[i + 1]) {
      options.candidates = parseInt(args[i + 1]);
    }
    if (args[i] === '--sample' && args[i + 1]) {
      options.sample = parseInt(args[i + 1]);
    }
  }

  console.log('🧠 AX-LLM Orthodox Instruction Optimizer\n');
  console.log('Configuration:');
  console.log(`- Agent type: ${options.agent}`);
  console.log(`- Optimizer: ${options.optimizer.toUpperCase()}`);
  console.log(`- Trials: ${options.trials}`);
  if (options.optimizer === 'mipro') {
    console.log(`- Candidates per trial: ${options.candidates}`);
    console.log('⚠️  Note: MIPROv2 requires Python optimizer service');
  } else if (options.optimizer === 'bootstrap') {
    console.log('✅ TypeScript-only mode (no Python backend needed)');
  }
  console.log(`- Sample size: ${options.sample}\n`);

  // Load dataset
  const datasetPath = './evals/data/gc_set_0925v1.jsonl';
  console.log(`📂 Loading dataset from: ${datasetPath}`);

  const loader = new DatasetLoader(datasetPath);
  const allExamples = loader.load();

  // Use sample
  const examples = allExamples.slice(0, options.sample);
  console.log(`✅ Using ${examples.length} examples for optimization\n`);

  // Get base instruction
  const baseInstruction = mainInstructions({
    context: {
      userId: 'test',
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

  console.log(`📝 Base instruction length: ${baseInstruction.length} characters\n`);

  // Initialize optimizer
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment');
  }

  const optimizer = new AxInstructionOptimizer(apiKey);

  // Run optimization
  let result;
  try {
    if (options.optimizer === 'bootstrap') {
      result = await optimizer.optimizeWithBootstrap(baseInstruction, examples, {
        numTrials: options.trials,
        maxBootstrappedDemos: 4,
        maxLabeledDemos: 4,
        verbose: true
      });
    } else if (options.optimizer === 'mipro') {
      result = await optimizer.optimizeWithMiPRO(baseInstruction, examples, {
        numTrials: options.trials,
        numCandidates: options.candidates,
        maxBootstrappedDemos: 3,
        maxLabeledDemos: 4,
        earlyStoppingTrials: 5,
        programAwareProposer: true,
        dataAwareProposer: true,
        bayesianOptimization: true,
        minibatch: true,
        minibatchSize: 25,
        verbose: true
      });
    } else {
      result = await optimizer.optimizeWithGEPA(baseInstruction, examples, {
        numTrials: options.trials,
        minibatch: true,
        minibatchSize: 6,
        verbose: true
      });
    }

    // Save results
    await optimizer.saveResults(result, options.agent);

    // Print summary
    console.log('================================================================================');
    console.log('OPTIMIZATION SUMMARY');
    console.log('================================================================================');
    console.log(`Optimizer: ${result.optimizer.toUpperCase()}`);
    console.log(`Agent Type: ${options.agent}`);
    console.log(`Baseline Score: ${result.baseline_score.toFixed(3)}`);
    console.log(`Optimized Score: ${result.optimized_score.toFixed(3)}`);
    console.log(`Improvement: +${result.improvement_percent.toFixed(1)}%`);
    console.log('');
    console.log('Detailed Metrics:');
    console.log(`- P1 (Acknowledge > Answer > Advance): ${result.detailed_metrics.p1.toFixed(3)}`);
    console.log(`- P2 (Never Repeat): ${result.detailed_metrics.p2.toFixed(3)}`);
    console.log(`- P3 (Respect Boundaries): ${result.detailed_metrics.p3.toFixed(3)}`);
    console.log(`- P4 (Soft Confirmations): ${result.detailed_metrics.p4.toFixed(3)}`);
    console.log(`- P5 (Always Offer Skip): ${result.detailed_metrics.p5.toFixed(3)}`);
    console.log(`- P6 (Deliver Value): ${result.detailed_metrics.p6.toFixed(3)}`);
    console.log(`- SMS Constraint (≤150 chars): ${result.detailed_metrics.sms.toFixed(3)}`);
    console.log(`- Forbidden Words: ${result.detailed_metrics.forbidden.toFixed(3)}`);
    console.log('');
    console.log('Optimization Stats:');
    console.log(`- Total trials: ${result.optimization_stats.total_trials}`);
    console.log(`- Best trial: ${result.optimization_stats.best_trial}`);
    console.log(`- Converged: ${result.optimization_stats.converged ? '✅' : '❌'}`);
    console.log(`- Time: ${(result.optimization_stats.optimization_time_ms / 1000).toFixed(1)}s`);
    console.log('================================================================================');
    console.log('');
    console.log('✨ Optimization complete!');
    console.log('📁 Check results/ directory for detailed output');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the optimized instruction');
    console.log('2. Test with real user scenarios');
    console.log('3. Deploy to src/instructions.ts if satisfied');

  } catch (error) {
    console.error('\n❌ Optimization failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
