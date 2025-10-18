/**
 * Agent Instruction Optimization using OpenAI SDK
 *
 * Optimizes trauma-informed agent instructions using iterative refinement
 * Uses OpenAI SDK directly for meta-prompting
 */

import { OpenAI } from 'openai';
import { DatasetLoader } from './dataset-loader';
import { TraumaInformedMetric } from './trauma-metric';
import type { EvalExample, OptimizationConfig, OptimizationResult } from './types';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export class InstructionOptimizer {
  private client: OpenAI;
  private metric: TraumaInformedMetric;
  private config: OptimizationConfig;

  constructor(
    private apiKey: string,
    config?: Partial<OptimizationConfig>
  ) {
    this.config = {
      modelName: config?.modelName || 'gpt-4o',  // Use gpt-4o (known working model)
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens || 2000,
      optimizationIterations: config?.optimizationIterations || 5,
    };

    this.client = new OpenAI({ apiKey: this.apiKey });
    this.metric = new TraumaInformedMetric(this.apiKey);
  }

  /**
   * Optimize agent instructions based on evaluation examples
   */
  async optimize(
    baseInstruction: string,
    examples: EvalExample[],
    agentType: 'main' | 'crisis' | 'assessment'
  ): Promise<OptimizationResult> {
    console.log(`\n🚀 Starting optimization for ${agentType} agent...`);
    console.log(`📊 Using ${examples.length} examples`);
    console.log(`🔄 Running ${this.config.optimizationIterations} iterations\n`);

    // Step 1: Evaluate baseline performance
    console.log('📈 Evaluating baseline instruction...');
    const baselineScore = await this.evaluateInstruction(baseInstruction, examples);
    console.log(`✅ Baseline score: ${baselineScore.overall.toFixed(2)}\n`);

    // Step 2: Iterative optimization
    let currentInstruction = baseInstruction;
    let currentScore = baselineScore;
    let bestInstruction = baseInstruction;
    let bestScore = baselineScore;

    for (let i = 1; i <= this.config.optimizationIterations; i++) {
      console.log(`\n🔄 Iteration ${i}/${this.config.optimizationIterations}`);

      // Generate improved instruction
      const improvedInstruction = await this.generateImprovedInstruction(
        currentInstruction,
        currentScore,
        examples.slice(0, 5)  // Use subset for faster iteration
      );

      // Evaluate improved instruction
      console.log('📊 Evaluating improved instruction...');
      const improvedScore = await this.evaluateInstruction(
        improvedInstruction,
        examples
      );

      console.log(`Score: ${improvedScore.overall.toFixed(2)} (Δ ${(improvedScore.overall - currentScore.overall).toFixed(2)})`);

      // Update if better
      if (improvedScore.overall > bestScore.overall) {
        bestInstruction = improvedInstruction;
        bestScore = improvedScore;
        console.log(`✨ New best score: ${bestScore.overall.toFixed(2)}`);
      }

      currentInstruction = improvedInstruction;
      currentScore = improvedScore;
    }

    // Calculate final metrics
    const improvement = bestScore.overall - baselineScore.overall;
    const improvementPercent = (improvement / baselineScore.overall) * 100;

    console.log(`\n✅ Optimization complete!`);
    console.log(`📊 Baseline: ${baselineScore.overall.toFixed(2)}`);
    console.log(`📈 Optimized: ${bestScore.overall.toFixed(2)}`);
    console.log(`🚀 Improvement: +${improvementPercent.toFixed(1)}%\n`);

    return {
      original_score: baselineScore.overall,
      optimized_score: bestScore.overall,
      improvement: improvementPercent,
      optimized_instruction: bestInstruction,
      metrics: {
        p1: bestScore.p1_acknowledge_answer_advance,
        p2: bestScore.p2_no_repetition,
        p3: bestScore.p3_respect_boundaries,
        p4: bestScore.p4_soft_confirmations,
        p5: bestScore.p5_offer_skip,
        p6: bestScore.p6_deliver_value,
        sms: bestScore.sms_constraint,
        forbidden: bestScore.forbidden_words,
      },
    };
  }

  /**
   * Evaluate instruction on examples
   */
  private async evaluateInstruction(
    instruction: string,
    examples: EvalExample[]
  ): Promise<any> {
    const scores: any[] = [];

    // Sample subset for faster evaluation
    const sampleSize = Math.min(10, examples.length);
    const sample = examples.slice(0, sampleSize);

    for (const example of sample) {
      const userMessage = example.prompt.find(p => p.role === 'user')?.content || '';

      // Generate response using instruction
      const response = await this.generateResponse(instruction, userMessage);

      // Evaluate response
      const score = await this.metric.evaluate(
        userMessage,
        instruction,
        response,
        example.answer
      );

      scores.push(score);
    }

    return this.metric.calculateAverageScores(scores);
  }

  /**
   * Generate response using current instruction
   */
  private async generateResponse(
    instruction: string,
    userMessage: string
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.modelName,
        messages: [
          { role: 'system', content: instruction },
          { role: 'user', content: userMessage }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Generation error:', error);
      return '';
    }
  }

  /**
   * Generate improved instruction using meta-prompting
   */
  private async generateImprovedInstruction(
    currentInstruction: string,
    currentScore: any,
    examples: EvalExample[]
  ): Promise<string> {
    // Create examples of failures
    const failureAnalysis = await this.analyzeFailures(
      currentInstruction,
      currentScore,
      examples
    );

    const metaPrompt = `You are an expert AI instruction optimizer specializing in trauma-informed care.

Your task: Improve the following agent instruction to better adhere to 6 trauma-informed principles:

**Current Instruction**:
${currentInstruction}

**Current Performance**:
- Overall Score: ${currentScore.overall.toFixed(2)}/1.0
- P1 (Acknowledge > Answer > Advance): ${currentScore.p1_acknowledge_answer_advance.toFixed(2)}
- P2 (Never Repeat): ${currentScore.p2_no_repetition.toFixed(2)}
- P3 (Respect Boundaries): ${currentScore.p3_respect_boundaries.toFixed(2)}
- P4 (Soft Confirmations): ${currentScore.p4_soft_confirmations.toFixed(2)}
- P5 (Always Offer Skip): ${currentScore.p5_offer_skip.toFixed(2)}
- P6 (Deliver Value): ${currentScore.p6_deliver_value.toFixed(2)}
- SMS Constraint (≤150 chars): ${currentScore.sms_constraint.toFixed(2)}
- Forbidden Words: ${currentScore.forbidden_words.toFixed(2)}

**Key Weaknesses**:
${failureAnalysis}

**Optimization Goals**:
1. Strengthen the lowest-scoring principles
2. Add specific guidance on HOW to implement each principle
3. Include concrete examples of good vs bad responses
4. Maintain the trauma-informed, compassionate tone
5. Keep instructions actionable and clear

**Requirements**:
- Preserve the core structure and agent role
- Add tactical guidance for weak areas
- Include 2-3 example response patterns
- Keep ≤500 words total

Return ONLY the improved instruction, no preamble or commentary.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.modelName,
        messages: [
          { role: 'user', content: metaPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,  // Allow longer responses for instructions
      });

      const outputText = response.choices[0]?.message?.content || '';
      return outputText.trim() || currentInstruction;
    } catch (error) {
      console.error('Improvement generation error:', error);
      return currentInstruction;  // Fallback to current
    }
  }

  /**
   * Analyze where current instruction fails
   */
  private async analyzeFailures(
    instruction: string,
    scores: any,
    examples: EvalExample[]
  ): Promise<string> {
    const weaknesses: string[] = [];

    // Identify lowest-scoring principles
    const principles = [
      { name: 'P1 (Acknowledge > Answer > Advance)', score: scores.p1_acknowledge_answer_advance },
      { name: 'P2 (Never Repeat)', score: scores.p2_no_repetition },
      { name: 'P3 (Respect Boundaries)', score: scores.p3_respect_boundaries },
      { name: 'P4 (Soft Confirmations)', score: scores.p4_soft_confirmations },
      { name: 'P5 (Always Offer Skip)', score: scores.p5_offer_skip },
      { name: 'P6 (Deliver Value)', score: scores.p6_deliver_value },
      { name: 'SMS Constraint', score: scores.sms_constraint },
      { name: 'Forbidden Words', score: scores.forbidden_words },
    ];

    // Sort by score ascending
    principles.sort((a, b) => a.score - b.score);

    // Take bottom 3
    for (let i = 0; i < 3; i++) {
      const p = principles[i];
      weaknesses.push(`- ${p.name}: ${p.score.toFixed(2)} (needs improvement)`);
    }

    return weaknesses.join('\n');
  }

  /**
   * Save optimization results
   */
  async saveResults(
    result: OptimizationResult,
    agentType: string,
    outputDir: string = './dspy_optimization/results'
  ): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${agentType}_optimized_${timestamp}.json`;
    const filepath = resolve(outputDir, filename);

    const output = {
      agent_type: agentType,
      timestamp: new Date().toISOString(),
      baseline_score: result.original_score,
      optimized_score: result.optimized_score,
      improvement_percent: result.improvement,
      optimized_instruction: result.optimized_instruction,
      detailed_metrics: result.metrics,
    };

    writeFileSync(filepath, JSON.stringify(output, null, 2));
    console.log(`💾 Results saved to: ${filepath}`);
  }
}
