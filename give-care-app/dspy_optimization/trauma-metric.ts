/**
 * Trauma-Informed Metric Evaluator
 *
 * Evaluates agent responses based on 6 trauma-informed principles (P1-P6)
 * Uses OpenAI SDK directly for LLM-as-judge evaluation
 */

import { OpenAI } from 'openai';
import type { EvalExample, TraumaInformedScore } from './types';

export class TraumaInformedMetric {
  private client: OpenAI;
  private modelName: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    // Use gpt-4o-mini for cost-effective evaluation
    this.modelName = 'gpt-4o-mini';
  }

  /**
   * Evaluate a response against trauma-informed principles
   */
  async evaluate(
    userMessage: string,
    systemInstruction: string,
    agentResponse: string,
    expectedAnswer?: string
  ): Promise<TraumaInformedScore> {
    const evaluationPrompt = `You are an expert evaluator of trauma-informed care principles.

Evaluate the following AI agent response based on these 6 principles:

**P1: Acknowledge > Answer > Advance** (0-1)
- Does the response validate feelings explicitly?
- Does it respond clearly to the question/concern?
- Does it offer a helpful next step?

**P2: Never Repeat** (0-1)
- Does the response avoid asking the same question twice?
- Is it respectful of information already shared?

**P3: Respect Boundaries** (0-1)
- Does it offer "skip for now" options when appropriate?
- Does it avoid being pushy or demanding?

**P4: Soft Confirmations** (0-1)
- Does it use gentle confirmation language ("Got it: Nadia, right?")
- Does it avoid assumptions about the user?

**P5: Always Offer Skip** (0-1)
- For requests/questions, is there an option to decline or defer?

**P6: Deliver Value Every Turn** (0-1)
- Does the response include something useful: validation, tip, resource, or progress update?

**SMS Constraint** (0-1)
- Is the response ≤150 characters (if possible)?
- For crisis/complex topics, longer is acceptable but should still be concise

**Forbidden Words** (0-1)
- Does it avoid "should", "must", "wrong", "fault", "blame"?

---

**User Message**: "${userMessage}"

**System Instruction**:
${systemInstruction}

**Agent Response**: "${agentResponse}"

${expectedAnswer ? `**Expected Answer**: "${expectedAnswer}"` : ''}

---

Return a JSON object with this structure:
{
  "p1_acknowledge_answer_advance": 0.0-1.0,
  "p2_no_repetition": 0.0-1.0,
  "p3_respect_boundaries": 0.0-1.0,
  "p4_soft_confirmations": 0.0-1.0,
  "p5_offer_skip": 0.0-1.0,
  "p6_deliver_value": 0.0-1.0,
  "sms_constraint": 0.0-1.0,
  "forbidden_words": 0.0-1.0,
  "breakdown": "Brief explanation of key strengths/weaknesses"
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'user', content: evaluationPrompt }
        ],
        temperature: 0.3,  // Low temperature for consistent evaluation
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || '{}';

      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;

      const scores = JSON.parse(jsonString);

      // Calculate weighted overall score
      const overall = this.calculateWeightedScore(scores);

      return {
        ...scores,
        overall,
      };
    } catch (error) {
      console.error('\n❌ Evaluation error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Stack:', error.stack);
      }
      // Return minimum scores on error
      return {
        p1_acknowledge_answer_advance: 0,
        p2_no_repetition: 0,
        p3_respect_boundaries: 0,
        p4_soft_confirmations: 0,
        p5_offer_skip: 0,
        p6_deliver_value: 0,
        sms_constraint: 0,
        forbidden_words: 0,
        overall: 0,
        breakdown: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Calculate weighted overall score
   *
   * Weights:
   * - P1 (Acknowledge/Answer/Advance): 20%
   * - P6 (Deliver Value): 20%
   * - P3 (Respect Boundaries): 15%
   * - P5 (Offer Skip): 15%
   * - Forbidden Words: 15%
   * - SMS Constraint: 10%
   * - P2 (No Repetition): 3%
   * - P4 (Soft Confirmations): 2%
   */
  private calculateWeightedScore(scores: Partial<TraumaInformedScore>): number {
    const weights = {
      p1: 0.20,
      p6: 0.20,
      p3: 0.15,
      p5: 0.15,
      forbidden: 0.15,
      sms: 0.10,
      p2: 0.03,
      p4: 0.02,
    };

    const weightedSum =
      (scores.p1_acknowledge_answer_advance || 0) * weights.p1 +
      (scores.p6_deliver_value || 0) * weights.p6 +
      (scores.p3_respect_boundaries || 0) * weights.p3 +
      (scores.p5_offer_skip || 0) * weights.p5 +
      (scores.forbidden_words || 0) * weights.forbidden +
      (scores.sms_constraint || 0) * weights.sms +
      (scores.p2_no_repetition || 0) * weights.p2 +
      (scores.p4_soft_confirmations || 0) * weights.p4;

    return Math.round(weightedSum * 100) / 100;  // Round to 2 decimals
  }

  /**
   * Batch evaluate multiple examples
   */
  async evaluateBatch(examples: EvalExample[]): Promise<TraumaInformedScore[]> {
    const results: TraumaInformedScore[] = [];

    for (const example of examples) {
      const systemMessage = example.prompt.find(p => p.role === 'system')?.content || '';
      const userMessage = example.prompt.find(p => p.role === 'user')?.content || '';

      const score = await this.evaluate(
        userMessage,
        systemMessage,
        example.answer,
        example.answer
      );

      results.push(score);

      // Log progress
      console.log(`Evaluated ${example.id}: ${score.overall.toFixed(2)}`);
    }

    return results;
  }

  /**
   * Calculate average scores across multiple evaluations
   */
  calculateAverageScores(scores: TraumaInformedScore[]): TraumaInformedScore {
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      p1_acknowledge_answer_advance: avg(scores.map(s => s.p1_acknowledge_answer_advance)),
      p2_no_repetition: avg(scores.map(s => s.p2_no_repetition)),
      p3_respect_boundaries: avg(scores.map(s => s.p3_respect_boundaries)),
      p4_soft_confirmations: avg(scores.map(s => s.p4_soft_confirmations)),
      p5_offer_skip: avg(scores.map(s => s.p5_offer_skip)),
      p6_deliver_value: avg(scores.map(s => s.p6_deliver_value)),
      sms_constraint: avg(scores.map(s => s.sms_constraint)),
      forbidden_words: avg(scores.map(s => s.forbidden_words)),
      overall: avg(scores.map(s => s.overall)),
      breakdown: `Average across ${scores.length} evaluations`,
    };
  }
}
