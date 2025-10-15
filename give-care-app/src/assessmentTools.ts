/**
 * Assessment definitions and scoring logic.
 * PRD §3.1: Clinical Assessments (EMA, CWBS, REACH-II, SDOH)
 * State machine delivers 1 question per turn.
 * Validated clinical tools with evidence-based scoring.
 */

import { z } from 'zod';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type AssessmentType = 'ema' | 'cwbs' | 'reach_ii' | 'sdoh';
export type AssessmentStatus = 'in_progress' | 'completed' | 'declined';

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'likert' | 'multiple_choice' | 'text' | 'boolean';
  scale?: number; // For likert scales (e.g., 1-5)
  options?: string[]; // For multiple choice
  subscale?: string; // Subdomain this question measures
  reverse_score?: boolean; // If true, reverse the scoring
}

export interface AssessmentDefinition {
  type: AssessmentType;
  name: string;
  description: string;
  questions: AssessmentQuestion[];
  scoring_method: 'sum' | 'average' | 'weighted' | 'subscales';
  evidence_level: string;
  validated: boolean;
  duration_minutes: number;
}

export interface AssessmentScore {
  overall_score: number | null; // 0-100, null if insufficient data
  subscores: Record<string, number>;
  band?: 'crisis' | 'high' | 'moderate' | 'mild' | 'thriving';
  calculated_at: Date;
}

// EMA (Ecological Momentary Assessment) - Daily pulse check
// Reduced to 3 questions for daily use (lower friction, higher completion rates)

const EMA_DEFINITION: AssessmentDefinition = {
  type: 'ema',
  name: 'Daily Check-In',
  description: 'Quick 3-question daily pulse check',
  questions: [
    {
      id: 'ema_1',
      text: 'How are you feeling right now? (1=very low, 5=great)',
      type: 'likert',
      scale: 5,
      subscale: 'mood',
    },
    {
      id: 'ema_2',
      text: 'How overwhelming does caregiving feel today? (1=not at all, 5=extremely)',
      type: 'likert',
      scale: 5,
      subscale: 'burden',
      reverse_score: true,
    },
    {
      id: 'ema_3',
      text: 'How stressed do you feel right now? (1=not at all, 5=extremely)',
      type: 'likert',
      scale: 5,
      subscale: 'stress',
      reverse_score: true,
    },
  ],
  scoring_method: 'average',
  evidence_level: 'clinical_trial',
  validated: true,
  duration_minutes: 1,
};

// CWBS (Caregiver Well-Being Scale) - Tebb, Berg-Weger & Rubio (1999, 2012)

const CWBS_DEFINITION: AssessmentDefinition = {
  type: 'cwbs',
  name: 'Caregiver Well-Being Scale',
  description: 'Assessment of caregiver activities and needs over the past three months',
  questions: [
    // Part I: ACTIVITIES (8 items) - Scale: 1=Rarely, 5=Usually
    {
      id: 'cwbs_1',
      text: 'Buying food (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'activities',
    },
    {
      id: 'cwbs_2',
      text: 'Taking care of personal daily activities (meals, hygiene, laundry) (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'activities',
    },
    {
      id: 'cwbs_3',
      text: 'Making sure medications are taken (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'activities',
    },
    {
      id: 'cwbs_4',
      text: 'Managing financial affairs (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'activities',
    },
    {
      id: 'cwbs_5',
      text: 'Arranging for services or medical appointments (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'activities',
    },
    {
      id: 'cwbs_6',
      text: 'Checking in and making sure they are ok (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'activities',
    },
    {
      id: 'cwbs_7',
      text: 'Providing transportation (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'activities',
    },
    {
      id: 'cwbs_8',
      text: 'Assisting with bathing and dressing (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'activities',
    },
    // Part II: NEEDS (basic + complex - 4 items) - Scale: 1=Rarely, 5=Usually
    {
      id: 'cwbs_9',
      text: 'I need a break from caregiving (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'needs',
      reverse_score: true,
    },
    {
      id: 'cwbs_10',
      text: 'I need help managing daily caregiving responsibilities (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'needs',
      reverse_score: true,
    },
    {
      id: 'cwbs_11',
      text: 'I need help coordinating all aspects of care (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'needs',
      reverse_score: true,
    },
    {
      id: 'cwbs_12',
      text: 'I need information about caregiving and available resources (1=rarely, 5=usually)',
      type: 'likert',
      scale: 5,
      subscale: 'needs',
      reverse_score: true,
    },
  ],
  scoring_method: 'subscales',
  evidence_level: 'clinical_trial',
  validated: true,
  duration_minutes: 3,
};

// REACH-II (Resources for Enhancing Alzheimer's Caregiver Health)

const REACH_II_DEFINITION: AssessmentDefinition = {
  type: 'reach_ii',
  name: 'Stress & Coping Assessment',
  description: 'Evidence-based assessment of caregiver stress and coping',
  questions: [
    {
      id: 'reach_1',
      text: 'In the past week, how often have you felt overwhelmed? (1=never, 5=always)',
      type: 'likert',
      scale: 5,
      subscale: 'stress',
      reverse_score: true,
    },
    {
      id: 'reach_2',
      text: 'How often do you feel you have enough time for yourself? (1=never, 5=always)',
      type: 'likert',
      scale: 5,
      subscale: 'self_care',
    },
    {
      id: 'reach_3',
      text: 'How often do you feel isolated or alone? (1=never, 5=always)',
      type: 'likert',
      scale: 5,
      subscale: 'social',
      reverse_score: true,
    },
    {
      id: 'reach_4',
      text: 'How confident are you in managing daily caregiving tasks? (1=not confident, 5=very confident)',
      type: 'likert',
      scale: 5,
      subscale: 'efficacy',
    },
    {
      id: 'reach_5',
      text: 'How often do you feel frustrated or angry about caregiving? (1=never, 5=always)',
      type: 'likert',
      scale: 5,
      subscale: 'emotional',
      reverse_score: true,
    },
    {
      id: 'reach_6',
      text: 'How often do you feel physically exhausted? (1=never, 5=always)',
      type: 'likert',
      scale: 5,
      subscale: 'physical',
      reverse_score: true,
    },
    {
      id: 'reach_7',
      text: 'How satisfied are you with your support network? (1=very dissatisfied, 5=very satisfied)',
      type: 'likert',
      scale: 5,
      subscale: 'support',
    },
    {
      id: 'reach_8',
      text: 'How often do you feel guilty about needing help? (1=never, 5=always)',
      type: 'likert',
      scale: 5,
      subscale: 'emotional',
      reverse_score: true,
    },
    {
      id: 'reach_9',
      text: 'How often do you engage in activities you enjoy? (1=never, 5=always)',
      type: 'likert',
      scale: 5,
      subscale: 'self_care',
    },
    {
      id: 'reach_10',
      text: 'How well are you managing your own health needs? (1=very poorly, 5=very well)',
      type: 'likert',
      scale: 5,
      subscale: 'self_care',
    },
  ],
  scoring_method: 'subscales',
  evidence_level: 'clinical_trial',
  validated: true,
  duration_minutes: 3,
};

// SDOH (Social Determinants of Health) - GC-SDOH-28

const SDOH_DEFINITION: AssessmentDefinition = {
  type: 'sdoh',
  name: 'Needs Screening',
  description: 'Comprehensive screening for social support needs',
  questions: [
    // Financial (5 questions)
    {
      id: 'sdoh_1',
      text: 'In the past year, have you worried about having enough money for food, housing, or utilities?',
      type: 'boolean',
      subscale: 'financial',
    },
    {
      id: 'sdoh_2',
      text: 'Do you currently have financial stress related to caregiving costs?',
      type: 'boolean',
      subscale: 'financial',
    },
    {
      id: 'sdoh_3',
      text: 'Have you had to reduce work hours or leave employment due to caregiving?',
      type: 'boolean',
      subscale: 'financial',
    },
    {
      id: 'sdoh_4',
      text: 'Do you have difficulty affording medications or medical care?',
      type: 'boolean',
      subscale: 'financial',
    },
    {
      id: 'sdoh_5',
      text: 'Are you worried about your long-term financial security?',
      type: 'boolean',
      subscale: 'financial',
    },
    // Housing (3 questions)
    {
      id: 'sdoh_6',
      text: 'Is your current housing safe and adequate for caregiving needs?',
      type: 'boolean',
      subscale: 'housing',
      reverse_score: true,
    },
    {
      id: 'sdoh_7',
      text: 'Have you considered moving due to caregiving demands?',
      type: 'boolean',
      subscale: 'housing',
    },
    {
      id: 'sdoh_8',
      text: 'Do you have accessibility concerns in your home (stairs, bathroom, etc.)?',
      type: 'boolean',
      subscale: 'housing',
    },
    // Transportation (3 questions)
    {
      id: 'sdoh_9',
      text: 'Do you have reliable transportation to medical appointments?',
      type: 'boolean',
      subscale: 'transportation',
      reverse_score: true,
    },
    {
      id: 'sdoh_10',
      text: 'Is transportation cost a barrier to accessing services?',
      type: 'boolean',
      subscale: 'transportation',
    },
    {
      id: 'sdoh_11',
      text: 'Do you have difficulty arranging transportation for your care recipient?',
      type: 'boolean',
      subscale: 'transportation',
    },
    // Social Support (5 questions)
    {
      id: 'sdoh_12',
      text: 'Do you have someone you can ask for help with caregiving?',
      type: 'boolean',
      subscale: 'social',
      reverse_score: true,
    },
    {
      id: 'sdoh_13',
      text: 'Do you feel isolated from friends and family?',
      type: 'boolean',
      subscale: 'social',
    },
    {
      id: 'sdoh_14',
      text: 'Are you part of a caregiver support group or community?',
      type: 'boolean',
      subscale: 'social',
      reverse_score: true,
    },
    {
      id: 'sdoh_15',
      text: 'Do you have trouble maintaining relationships due to caregiving?',
      type: 'boolean',
      subscale: 'social',
    },
    {
      id: 'sdoh_16',
      text: 'Do you wish you had more emotional support?',
      type: 'boolean',
      subscale: 'social',
    },
    // Healthcare Access (4 questions)
    {
      id: 'sdoh_17',
      text: 'Do you have health insurance for yourself?',
      type: 'boolean',
      subscale: 'healthcare',
      reverse_score: true,
    },
    {
      id: 'sdoh_18',
      text: 'Have you delayed your own medical care due to caregiving?',
      type: 'boolean',
      subscale: 'healthcare',
    },
    {
      id: 'sdoh_19',
      text: 'Do you have a regular doctor or healthcare provider?',
      type: 'boolean',
      subscale: 'healthcare',
      reverse_score: true,
    },
    {
      id: 'sdoh_20',
      text: 'Are you satisfied with the healthcare your care recipient receives?',
      type: 'boolean',
      subscale: 'healthcare',
      reverse_score: true,
    },
    // Food Security (3 questions)
    {
      id: 'sdoh_21',
      text: 'In the past month, did you worry about running out of food?',
      type: 'boolean',
      subscale: 'food',
    },
    {
      id: 'sdoh_22',
      text: 'Have you had to skip meals due to lack of money?',
      type: 'boolean',
      subscale: 'food',
    },
    {
      id: 'sdoh_23',
      text: 'Do you have access to healthy, nutritious food?',
      type: 'boolean',
      subscale: 'food',
      reverse_score: true,
    },
    // Legal/Administrative (3 questions)
    {
      id: 'sdoh_24',
      text: 'Do you have legal documents in place (POA, advance directives)?',
      type: 'boolean',
      subscale: 'legal',
      reverse_score: true,
    },
    {
      id: 'sdoh_25',
      text: 'Do you need help navigating insurance or benefits?',
      type: 'boolean',
      subscale: 'legal',
    },
    {
      id: 'sdoh_26',
      text: 'Are you concerned about future care planning?',
      type: 'boolean',
      subscale: 'legal',
    },
    // Technology Access (2 questions)
    {
      id: 'sdoh_27',
      text: 'Do you have reliable internet access?',
      type: 'boolean',
      subscale: 'technology',
      reverse_score: true,
    },
    {
      id: 'sdoh_28',
      text: 'Are you comfortable using technology for healthcare or support services?',
      type: 'boolean',
      subscale: 'technology',
      reverse_score: true,
    },
  ],
  scoring_method: 'subscales',
  evidence_level: 'expert_consensus',
  validated: true,
  duration_minutes: 5,
};

// REGISTRY - All assessment definitions

const ASSESSMENT_REGISTRY: Record<AssessmentType, AssessmentDefinition> = {
  ema: EMA_DEFINITION,
  cwbs: CWBS_DEFINITION,
  reach_ii: REACH_II_DEFINITION,
  sdoh: SDOH_DEFINITION,
};

// HELPER FUNCTIONS
// =============================================================================

export function getAssessmentDefinition(
  type: AssessmentType
): AssessmentDefinition | null {
  return ASSESSMENT_REGISTRY[type] || null;
}

export function getNextQuestion(
  type: AssessmentType,
  questionIndex: number
): AssessmentQuestion | null {
  const definition = getAssessmentDefinition(type);
  if (!definition || questionIndex >= definition.questions.length) {
    return null;
  }
  return definition.questions[questionIndex];
}

export function calculateAssessmentScore(
  type: AssessmentType,
  responses: Record<string, string | number>
): AssessmentScore {
  const definition = getAssessmentDefinition(type);
  if (!definition) {
    throw new Error(`Unknown assessment type: ${type}`);
  }

  const subscores: Record<string, number> = {};
  const subscaleCounts: Record<string, number> = {};

  // Calculate subscale scores
  for (const question of definition.questions) {
    const response = responses[question.id];
    if (response === undefined || response === 'SKIPPED') continue;

    let score = 0;

    if (question.type === 'likert') {
      // Input validation: prevent NaN from invalid responses
      const numericValue = Number(response);
      if (Number.isNaN(numericValue)) {
        // Skip invalid responses (treat as SKIPPED)
        continue;
      }
      score = numericValue;
      // Reverse score if needed (higher is better)
      if (question.reverse_score && question.scale) {
        score = question.scale + 1 - score;
      }
      // Normalize to 0-100
      if (question.scale) {
        score = ((score - 1) / (question.scale - 1)) * 100;
      }
    } else if (question.type === 'boolean') {
      // Boolean: true = 100 (issue present), false = 0 (no issue)
      score = response === 'true' || response === 'yes' || response === '1' ? 100 : 0;
      // Reverse if needed
      if (question.reverse_score) {
        score = 100 - score;
      }
    }

    // Accumulate by subscale
    const subscale = question.subscale || 'overall';
    subscores[subscale] = (subscores[subscale] || 0) + score;
    subscaleCounts[subscale] = (subscaleCounts[subscale] || 0) + 1;
  }

  // Average each subscale
  for (const subscale in subscores) {
    subscores[subscale] = subscores[subscale] / (subscaleCounts[subscale] || 1);
  }

  // Calculate overall score
  // GUARD AGAINST DIVISION BY ZERO: If no valid responses, return null
  const values = Object.values(subscores);
  if (values.length === 0) {
    // No valid responses - return null score with empty subscores
    return {
      overall_score: null,
      subscores: {},
      band: undefined,
      calculated_at: new Date(),
    };
  }

  let overallScore = 0;
  if (definition.scoring_method === 'average' || definition.scoring_method === 'subscales') {
    overallScore = values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Determine band (inverse - lower score = more burnout)
  let band: AssessmentScore['band'];
  if (overallScore < 20) band = 'crisis';
  else if (overallScore < 40) band = 'high';
  else if (overallScore < 60) band = 'moderate';
  else if (overallScore < 80) band = 'mild';
  else band = 'thriving';

  return {
    overall_score: Math.round(overallScore * 10) / 10,
    subscores,
    band,
    calculated_at: new Date(),
  };
}

// EXPORTS

export { ASSESSMENT_REGISTRY, EMA_DEFINITION, CWBS_DEFINITION, REACH_II_DEFINITION, SDOH_DEFINITION };