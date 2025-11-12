/**
 * Assessment Catalog
 * 4 validated assessments: EMA, CWBS, REACH-II, SDOH
 */

export type AssessmentType = "ema" | "cwbs" | "reach2" | "sdoh";

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
 */
export const EMA_DEFINITION: AssessmentDefinition = {
  id: "ema",
  title: "Daily Check-In",
  description: "Quick 3-question check-in to track how you're feeling",
  questions: [
    {
      id: "ema_1",
      text: "On a scale of 1-5, how stressed have you felt today? (1=not at all, 5=extremely)",
      zone: "zone_emotional",
    },
    {
      id: "ema_2",
      text: "How's your mood been? (1=very down, 5=very up)",
      zone: "zone_emotional",
    },
    {
      id: "ema_3",
      text: "How much support do you feel you have right now? (1=none, 5=a lot)",
      zone: "zone_social",
    },
  ],
  cooldownDays: 1, // Can retake daily
  zones: ["zone_emotional", "zone_social"],
};

/**
 * CWBS - Caregiver Well-Being Scale (12 questions, 3 min)
 */
export const CWBS_DEFINITION: AssessmentDefinition = {
  id: "cwbs",
  title: "Caregiver Well-Being Assessment",
  description: "12 questions to assess your caregiver well-being",
  questions: [
    {
      id: "cwbs_1",
      text: "I feel overwhelmed by my caregiving responsibilities. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "cwbs_2",
      text: "I feel physically exhausted. (1=never, 5=always)",
      zone: "zone_physical",
    },
    {
      id: "cwbs_3",
      text: "I have time for myself. (1=never, 5=always)",
      zone: "zone_time",
    },
    {
      id: "cwbs_4",
      text: "I feel isolated from friends and family. (1=never, 5=always)",
      zone: "zone_social",
    },
    {
      id: "cwbs_5",
      text: "I feel confident in my caregiving abilities. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "cwbs_6",
      text: "I feel my health is suffering due to caregiving. (1=never, 5=always)",
      zone: "zone_physical",
    },
    {
      id: "cwbs_7",
      text: "I feel I have control over my daily schedule. (1=never, 5=always)",
      zone: "zone_time",
    },
    {
      id: "cwbs_8",
      text: "I feel supported by others. (1=never, 5=always)",
      zone: "zone_social",
    },
    {
      id: "cwbs_9",
      text: "I feel anxious about caregiving. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "cwbs_10",
      text: "I feel I get enough sleep. (1=never, 5=always)",
      zone: "zone_physical",
    },
    {
      id: "cwbs_11",
      text: "I feel I can balance caregiving with other responsibilities. (1=never, 5=always)",
      zone: "zone_time",
    },
    {
      id: "cwbs_12",
      text: "I feel connected to a community. (1=never, 5=always)",
      zone: "zone_social",
    },
  ],
  cooldownDays: 7, // Weekly frequency
  zones: ["zone_emotional", "zone_physical", "zone_social", "zone_time"],
};

/**
 * REACH-II - Resources for Enhancing Alzheimer's Caregiver Health (16 questions, 8 min)
 * Canonical domains: depression, burden, self-care/health behaviors, social support, safety, patient problem behaviors
 */
export const REACH2_DEFINITION: AssessmentDefinition = {
  id: "reach2",
  title: "Caregiver Risk Assessment",
  description: "16 questions to assess caregiver risk and needs",
  questions: [
    // Depression domain (questions 1-3)
    {
      id: "reach2_1",
      text: "I feel down or depressed. (1=rarely, 5=most of the time)",
      zone: "zone_emotional",
    },
    {
      id: "reach2_2",
      text: "I have lost interest in activities I used to enjoy. (1=rarely, 5=most of the time)",
      zone: "zone_emotional",
    },
    {
      id: "reach2_3",
      text: "I feel hopeless about the future. (1=rarely, 5=most of the time)",
      zone: "zone_emotional",
    },
    // Burden domain (questions 4-6)
    {
      id: "reach2_4",
      text: "I feel that caregiving is too much for me. (1=rarely, 5=most of the time)",
      zone: "zone_emotional",
    },
    {
      id: "reach2_5",
      text: "I feel trapped by my caregiving role. (1=rarely, 5=most of the time)",
      zone: "zone_emotional",
    },
    {
      id: "reach2_6",
      text: "I feel that caregiving has disrupted my life. (1=rarely, 5=most of the time)",
      zone: "zone_time",
    },
    // Self-care/health behaviors (questions 7-9)
    {
      id: "reach2_7",
      text: "I take time for my own health needs. (1=rarely, 5=most of the time)",
      zone: "zone_physical",
    },
    {
      id: "reach2_8",
      text: "I exercise regularly. (1=rarely, 5=most of the time)",
      zone: "zone_physical",
    },
    {
      id: "reach2_9",
      text: "I eat regular, healthy meals. (1=rarely, 5=most of the time)",
      zone: "zone_physical",
    },
    // Social support (questions 10-12)
    {
      id: "reach2_10",
      text: "I have people I can talk to about caregiving. (1=rarely, 5=most of the time)",
      zone: "zone_social",
    },
    {
      id: "reach2_11",
      text: "I feel supported by family and friends. (1=rarely, 5=most of the time)",
      zone: "zone_social",
    },
    {
      id: "reach2_12",
      text: "I participate in social activities. (1=rarely, 5=most of the time)",
      zone: "zone_social",
    },
    // Safety (questions 13-14)
    {
      id: "reach2_13",
      text: "I worry about the person I care for wandering or getting lost. (1=rarely, 5=most of the time)",
      zone: "zone_emotional",
    },
    {
      id: "reach2_14",
      text: "I worry about the person I care for falling or injuring themselves. (1=rarely, 5=most of the time)",
      zone: "zone_emotional",
    },
    // Patient problem behaviors (questions 15-16)
    {
      id: "reach2_15",
      text: "The person I care for has behaviors that are difficult to manage. (1=rarely, 5=most of the time)",
      zone: "zone_emotional",
    },
    {
      id: "reach2_16",
      text: "I feel prepared to handle difficult behaviors. (1=rarely, 5=most of the time)",
      zone: "zone_emotional",
    },
  ],
  cooldownDays: 21, // 3 weeks
  zones: ["zone_emotional", "zone_physical", "zone_social", "zone_time"],
};

/**
 * SDOH - Social Determinants of Health (28 questions, 5 min)
 * Custom GC-SDOH-28 assessment
 */
export const SDOH_DEFINITION: AssessmentDefinition = {
  id: "sdoh",
  title: "Social Needs Assessment",
  description: "28 questions about your social and economic needs",
  questions: [
    // Financial (questions 1-6)
    {
      id: "sdoh_1",
      text: "I worry about having enough money for basic needs. (1=never, 5=always)",
      zone: "zone_financial",
    },
    {
      id: "sdoh_2",
      text: "I have difficulty paying for medical care. (1=never, 5=always)",
      zone: "zone_financial",
    },
    {
      id: "sdoh_3",
      text: "I have difficulty paying for medications. (1=never, 5=always)",
      zone: "zone_financial",
    },
    {
      id: "sdoh_4",
      text: "I worry about housing costs. (1=never, 5=always)",
      zone: "zone_financial",
    },
    {
      id: "sdoh_5",
      text: "I have difficulty paying for utilities. (1=never, 5=always)",
      zone: "zone_financial",
    },
    {
      id: "sdoh_6",
      text: "I have difficulty paying for food. (1=never, 5=always)",
      zone: "zone_financial",
    },
    // Transportation (questions 7-10)
    {
      id: "sdoh_7",
      text: "I have reliable transportation to medical appointments. (1=never, 5=always)",
      zone: "zone_time",
    },
    {
      id: "sdoh_8",
      text: "I have reliable transportation for daily needs. (1=never, 5=always)",
      zone: "zone_time",
    },
    {
      id: "sdoh_9",
      text: "Transportation costs are a burden. (1=never, 5=always)",
      zone: "zone_financial",
    },
    {
      id: "sdoh_10",
      text: "I can easily get to community resources. (1=never, 5=always)",
      zone: "zone_time",
    },
    // Housing (questions 11-14)
    {
      id: "sdoh_11",
      text: "My housing is stable and secure. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "sdoh_12",
      text: "My home is safe and in good condition. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "sdoh_13",
      text: "I worry about losing my housing. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "sdoh_14",
      text: "My housing meets my caregiving needs. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    // Community (questions 15-18)
    {
      id: "sdoh_15",
      text: "I feel safe in my neighborhood. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "sdoh_16",
      text: "I have access to healthy food in my area. (1=never, 5=always)",
      zone: "zone_physical",
    },
    {
      id: "sdoh_17",
      text: "I have access to parks or recreation areas. (1=never, 5=always)",
      zone: "zone_physical",
    },
    {
      id: "sdoh_18",
      text: "I feel connected to my community. (1=never, 5=always)",
      zone: "zone_social",
    },
    // Clinical coordination (questions 19-22)
    {
      id: "sdoh_19",
      text: "I can easily communicate with healthcare providers. (1=never, 5=always)",
      zone: "zone_time",
    },
    {
      id: "sdoh_20",
      text: "I understand the medical information I receive. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "sdoh_21",
      text: "I can coordinate care between multiple providers. (1=never, 5=always)",
      zone: "zone_time",
    },
    {
      id: "sdoh_22",
      text: "I have access to medical records when needed. (1=never, 5=always)",
      zone: "zone_time",
    },
    // Additional questions (23-28)
    {
      id: "sdoh_23",
      text: "I have access to internet for health information. (1=never, 5=always)",
      zone: "zone_time",
    },
    {
      id: "sdoh_24",
      text: "I can afford internet/phone service. (1=never, 5=always)",
      zone: "zone_financial",
    },
    {
      id: "sdoh_25",
      text: "I have someone to help in an emergency. (1=never, 5=always)",
      zone: "zone_social",
    },
    {
      id: "sdoh_26",
      text: "I feel prepared for caregiving emergencies. (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "sdoh_27",
      text: "I have legal documents in order (power of attorney, etc.). (1=never, 5=always)",
      zone: "zone_emotional",
    },
    {
      id: "sdoh_28",
      text: "I understand my rights as a caregiver. (1=never, 5=always)",
      zone: "zone_emotional",
    },
  ],
  cooldownDays: 30, // Monthly
  zones: [
    "zone_financial",
    "zone_emotional",
    "zone_physical",
    "zone_social",
    "zone_time",
  ],
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
    case "cwbs":
      return CWBS_DEFINITION;
    case "reach2":
      return REACH2_DEFINITION;
    case "sdoh":
      return SDOH_DEFINITION;
    default:
      throw new Error(`Unknown assessment type: ${type}`);
  }
}

/**
 * Get all assessment definitions
 */
export function getAllAssessmentDefinitions(): AssessmentDefinition[] {
  return [
    EMA_DEFINITION,
    CWBS_DEFINITION,
    REACH2_DEFINITION,
    SDOH_DEFINITION,
  ];
}

