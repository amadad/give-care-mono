/**
 * GiveCare TypeScript - Main Entry Point
 * OpenAI Agents SDK 0.1.9 | Convex 1.11.0 | GPT-5 Nano
 */

// Agents & orchestration
export { giveCareAgent, crisisAgent, assessmentAgent, runAgentTurn } from './src/agents';

// Tools
export {
  updateProfile,
  startAssessment,
  recordAssessmentAnswer,
  checkWellnessStatus,
  findInterventions,
  allTools,
} from './src/tools';

// Assessments
export {
  type AssessmentType,
  type AssessmentDefinition,
  type AssessmentQuestion,
  type AssessmentScore,
  getAssessmentDefinition,
  getNextQuestion,
  calculateAssessmentScore,
} from './src/assessmentTools';

// Burnout scoring
export {
  type BurnoutScore,
  type PreviousScore,
  calculateCompositeScore,
  getZoneDescription,
} from './src/burnoutCalculator';

// Guardrails
export {
  crisisGuardrail,
  spamGuardrail,
  medicalAdviceGuardrail,
  safetyGuardrail,
  allInputGuardrails,
  allOutputGuardrails,
  detectCrisis,
} from './src/safety';

// Instructions
export { crisisInstructions, assessmentInstructions, mainInstructions } from './src/instructions';

// Context & types
export type { GiveCareContext } from './src/context';
