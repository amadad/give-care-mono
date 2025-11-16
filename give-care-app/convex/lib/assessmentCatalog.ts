/**
 * Assessment Catalog
 * 2 validated assessments: EMA, SDOH-28
 */

export type AssessmentType = "ema" | "sdoh";

export interface AssessmentQuestion {
  id: string;
  text: string;
  zone?: string; // For zone-based scoring
}

export interface AssessmentDefinition {
  id: AssessmentType;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  cooldownDays: number;
  zones: string[]; // Pressure zones this assessment covers
}

/**
 * EMA - Ecological Momentary Assessment (3 questions, 2 min)
 * Daily stress pulse check
 * Updates P6 (emotional) + P1 (social support)
 */
export const EMA_DEFINITION: AssessmentDefinition = {
  id: "ema",
  title: "Daily Check-In",
  description: "Quick 3-question check-in to track how you're feeling",
  questions: [
    {
      id: "ema_1",
      text: "On a scale of 1-5, how stressed have you felt today? (1=not at all, 5=extremely)",
      zone: "P6", // Emotional Wellbeing
    },
    {
      id: "ema_2",
      text: "How's your mood been? (1=very down, 5=very up)",
      zone: "P6", // Emotional Wellbeing
    },
    {
      id: "ema_3",
      text: "How much support do you feel you have right now? (1=none, 5=a lot)",
      zone: "P1", // Relationship & Social Support
    },
  ],
  cooldownDays: 1, // Can retake daily
  zones: ["P6", "P1"],
};

/**
 * SDOH-28 - Social Determinants of Health (28 questions, 5 min)
 * Maps to P1 (8), P3 (4), P4 (8), P5 (6), P6 (2)
 */
export const SDOH_DEFINITION: AssessmentDefinition = {
  id: "sdoh",
  title: "Social Needs Assessment",
  description: "28 questions about your social and economic needs",
  questions: [
    // P1 - Relationship & Social Support (8 questions: 1-8)
    {
      id: "sdoh_1",
      text: "I have people I can rely on for emotional support. (1=never, 5=always)",
      zone: "P1",
    },
    {
      id: "sdoh_2",
      text: "I feel connected to my community. (1=never, 5=always)",
      zone: "P1",
    },
    {
      id: "sdoh_3",
      text: "I have someone to help in an emergency. (1=never, 5=always)",
      zone: "P1",
    },
    {
      id: "sdoh_4",
      text: "I can talk to others about my caregiving challenges. (1=never, 5=always)",
      zone: "P1",
    },
    {
      id: "sdoh_5",
      text: "I feel supported by family and friends. (1=never, 5=always)",
      zone: "P1",
    },
    {
      id: "sdoh_6",
      text: "I have people who understand what I'm going through. (1=never, 5=always)",
      zone: "P1",
    },
    {
      id: "sdoh_7",
      text: "I can ask for help when I need it. (1=never, 5=always)",
      zone: "P1",
    },
    {
      id: "sdoh_8",
      text: "I participate in social activities. (1=never, 5=always)",
      zone: "P1",
    },
    // P3 - Housing & Environment (4 questions: 9-12)
    {
      id: "sdoh_9",
      text: "My housing is stable and secure. (1=never, 5=always)",
      zone: "P3",
    },
    {
      id: "sdoh_10",
      text: "My home is safe and in good condition. (1=never, 5=always)",
      zone: "P3",
    },
    {
      id: "sdoh_11",
      text: "I worry about losing my housing. (1=never, 5=always)",
      zone: "P3",
    },
    {
      id: "sdoh_12",
      text: "My housing meets my caregiving needs. (1=never, 5=always)",
      zone: "P3",
    },
    // P4 - Financial Resources (8 questions: 13-20)
    {
      id: "sdoh_13",
      text: "I worry about having enough money for basic needs. (1=never, 5=always)",
      zone: "P4",
    },
    {
      id: "sdoh_14",
      text: "I have difficulty paying for medical care. (1=never, 5=always)",
      zone: "P4",
    },
    {
      id: "sdoh_15",
      text: "I have difficulty paying for medications. (1=never, 5=always)",
      zone: "P4",
    },
    {
      id: "sdoh_16",
      text: "I worry about housing costs. (1=never, 5=always)",
      zone: "P4",
    },
    {
      id: "sdoh_17",
      text: "I have difficulty paying for utilities. (1=never, 5=always)",
      zone: "P4",
    },
    {
      id: "sdoh_18",
      text: "I have difficulty paying for food. (1=never, 5=always)",
      zone: "P4",
    },
    {
      id: "sdoh_19",
      text: "Transportation costs are a burden. (1=never, 5=always)",
      zone: "P4",
    },
    {
      id: "sdoh_20",
      text: "I can afford internet/phone service. (1=never, 5=always)",
      zone: "P4",
    },
    // P5 - Legal & Navigation (6 questions: 21-26)
    {
      id: "sdoh_21",
      text: "I can easily communicate with healthcare providers. (1=never, 5=always)",
      zone: "P5",
    },
    {
      id: "sdoh_22",
      text: "I understand the medical information I receive. (1=never, 5=always)",
      zone: "P5",
    },
    {
      id: "sdoh_23",
      text: "I can coordinate care between multiple providers. (1=never, 5=always)",
      zone: "P5",
    },
    {
      id: "sdoh_24",
      text: "I have access to medical records when needed. (1=never, 5=always)",
      zone: "P5",
    },
    {
      id: "sdoh_25",
      text: "I have legal documents in order (power of attorney, etc.). (1=never, 5=always)",
      zone: "P5",
    },
    {
      id: "sdoh_26",
      text: "I understand my rights as a caregiver. (1=never, 5=always)",
      zone: "P5",
    },
    // P6 - Emotional Wellbeing (2 questions: 27-28)
    {
      id: "sdoh_27",
      text: "I feel prepared for caregiving emergencies. (1=never, 5=always)",
      zone: "P6",
    },
    {
      id: "sdoh_28",
      text: "I feel safe in my neighborhood. (1=never, 5=always)",
      zone: "P6",
    },
  ],
  cooldownDays: 30, // Monthly
  zones: ["P1", "P3", "P4", "P5", "P6"],
};

/**
 * Get assessment definition by type
 */
export function getAssessmentDefinition(
  type: AssessmentType
): AssessmentDefinition {
  switch (type) {
    case "ema":
      return EMA_DEFINITION;
    case "sdoh":
      return SDOH_DEFINITION;
    default: {
      // TypeScript knows all cases are handled, but we need this for runtime safety
      const _exhaustive: never = type;
      throw new Error(`Unknown assessment type: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Get all assessment definitions
 */
export function getAllAssessmentDefinitions(): AssessmentDefinition[] {
  return [
    EMA_DEFINITION,
    SDOH_DEFINITION,
  ];
}

