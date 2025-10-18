/**
 * Type definitions for DSPy-style optimization using ax library (MiPRO v2)
 *
 * Updated to use descriptive field names following ax-llm v14+ guidelines
 */

export interface EvalExample {
  id: string;
  task: string;
  prompt: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  answer: string;
  info: {
    instruction: string;
    labels: {
      category: string;
      trauma_principles: string[];
      source?: string;
    };
  };
}

/**
 * Descriptive field names for ax-llm programs
 *
 * These replace generic names like "userMessage" and "agentResponse"
 * with context-specific names that describe what the field contains.
 */
export interface TraumaInformedProgramFields {
  caregiverQuestion: string;  // Caregiver's support request or question
  traumaInformedReply: string;  // Trauma-informed response following P1-P6 principles
}

export interface OptimizationConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
  optimizationIterations: number;
}

export interface TraumaInformedScore {
  p1_acknowledge_answer_advance: number;  // 0-1
  p2_no_repetition: number;  // 0-1
  p3_respect_boundaries: number;  // 0-1
  p4_soft_confirmations: number;  // 0-1
  p5_offer_skip: number;  // 0-1
  p6_deliver_value: number;  // 0-1
  sms_constraint: number;  // 0-1 (<=150 chars)
  forbidden_words: number;  // 0-1 (no "should", "must", "wrong")
  overall: number;  // weighted average
  breakdown: string;  // explanation
}

export interface OptimizationResult {
  original_score: number;
  optimized_score: number;
  improvement: number;
  optimized_instruction: string;
  metrics: {
    p1: number;
    p2: number;
    p3: number;
    p4: number;
    p5: number;
    p6: number;
    sms: number;
    forbidden: number;
  };
}
