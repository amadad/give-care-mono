/**
 * BSFC (Burden Scale for Family Caregivers) Utilities
 * Based on BSFC-s (short version) with 10 questions
 * Developed by Elmar Graessel et al., Erlangen University Hospital
 */

export interface BsfcQuestion {
  id: number;
  text: string;
}

export interface PressureZone {
  name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  questionIndices: number[];
}

export const BSFC_SHORT_QUESTIONS: BsfcQuestion[] = [
  { id: 1, text: "My life satisfaction has suffered because of the care" },
  { id: 2, text: "I often feel physically exhausted" },
  { id: 3, text: "From time to time I wish I could \"run away\" from the situation" },
  { id: 4, text: "Sometimes I don't really feel like \"myself\" as before" },
  { id: 5, text: "Since I have been a caregiver my financial situation has decreased" },
  { id: 6, text: "My health is affected by the care situation" },
  { id: 7, text: "The care takes a lot of my own strength" },
  { id: 8, text: "I feel torn between the demands of my environment and the care" },
  { id: 9, text: "I am worried about my future because of the care" },
  { id: 10, text: "My relationships with others are suffering as a result of the care" },
];

export const SCALE_OPTIONS = [
  { value: 3, label: "Strongly agree" },
  { value: 2, label: "Agree" },
  { value: 1, label: "Disagree" },
  { value: 0, label: "Strongly disagree" },
];

/**
 * Calculate total BSFC score from responses
 * @param responses Array of 10 responses (0-3 each)
 * @returns Total score (0-30)
 */
export function calculateScore(responses: number[]): number {
  if (responses.length !== 10) {
    throw new Error('BSFC-s requires exactly 10 responses');
  }

  const total = responses.reduce((sum, response) => {
    if (response < 0 || response > 3) {
      throw new Error('Each response must be between 0 and 3');
    }
    return sum + response;
  }, 0);

  return total;
}

/**
 * Get burden band based on score
 * Thresholds derived from validated full BSFC cutoffs (non-dementia):
 * - Full BSFC: 0-41 (mild), 42-55 (moderate), 56-84 (severe)
 * - Scaled to BSFC-s: 30/84 = 0.357 factor
 * - BSFC-s: 0-14 (mild), 15-19 (moderate), 20-30 (severe)
 * @param score Total score (0-30)
 * @returns Burden band
 */
export function getBurdenBand(score: number): 'Mild' | 'Moderate' | 'Severe' {
  if (score <= 14) return 'Mild';
  if (score <= 19) return 'Moderate';
  return 'Severe';
}

/**
 * Get interpretation text for burden band
 * @param band Burden band
 * @returns Interpretation message
 */
export function getInterpretation(band: 'Mild' | 'Moderate' | 'Severe'): string {
  const interpretations = {
    Mild: "Your burden level is in the mild range. You're managing well, but it's still important to practice self-care and monitor your wellbeing.",
    Moderate: "Your burden level is moderate. You're experiencing significant stress. Evidence-based interventions can help reduce your burden and improve your quality of life. Consider discussing your caregiving situation with a healthcare professional.",
    Severe: "Your burden level is severe, which indicates you may be experiencing significant stress that could impact your health. We strongly encourage you to consult with a healthcare professional, therapist, or counselor who can provide personalized support. Immediate relief and professional guidance are important for your wellbeing.",
  };

  return interpretations[band];
}

/**
 * Identify top pressure zones from responses
 * Maps BSFC-s questions to pressure categories
 * @param responses Array of 10 responses (0-3 each)
 * @returns Array of identified pressure zones (up to 3)
 */
export function identifyPressureZones(responses: number[]): PressureZone[] {
  const zones: PressureZone[] = [];

  // Physical Exhaustion (Q2, Q6, Q7)
  const physicalScore = responses[1] + responses[5] + responses[6];
  if (physicalScore >= 6) {
    zones.push({
      name: "Physical Exhaustion",
      severity: physicalScore >= 8 ? 'critical' : 'high',
      description: "Sleep deprivation, health decline, chronic fatigue",
      questionIndices: [2, 6, 7]
    });
  } else if (physicalScore >= 4) {
    zones.push({
      name: "Physical Exhaustion",
      severity: 'moderate',
      description: "Sleep deprivation, health decline, chronic fatigue",
      questionIndices: [2, 6, 7]
    });
  }

  // Emotional Burden (Q1, Q3, Q4)
  const emotionalScore = responses[0] + responses[2] + responses[3];
  if (emotionalScore >= 6) {
    zones.push({
      name: "Emotional Burden",
      severity: emotionalScore >= 8 ? 'critical' : 'high',
      description: "Anxiety, depression, grief, loss of identity",
      questionIndices: [1, 3, 4]
    });
  } else if (emotionalScore >= 4) {
    zones.push({
      name: "Emotional Burden",
      severity: 'moderate',
      description: "Anxiety, depression, grief, loss of identity",
      questionIndices: [1, 3, 4]
    });
  }

  // Financial Strain (Q5)
  if (responses[4] >= 2) {
    zones.push({
      name: "Financial Strain",
      severity: responses[4] === 3 ? 'high' : 'moderate',
      description: "Bills, insurance costs, lost income",
      questionIndices: [5]
    });
  }

  // Social Isolation (Q8, Q10)
  const socialScore = responses[7] + responses[9];
  if (socialScore >= 4) {
    zones.push({
      name: "Social Isolation",
      severity: socialScore >= 5 ? 'high' : 'moderate',
      description: "Strained relationships, lack of support",
      questionIndices: [8, 10]
    });
  }

  // Future Uncertainty (Q9)
  if (responses[8] >= 2) {
    zones.push({
      name: "Future Uncertainty",
      severity: responses[8] === 3 ? 'moderate' : 'low',
      description: "Worry about long-term care, planning anxiety",
      questionIndices: [9]
    });
  }

  // Sort by severity and return top 3
  const severityOrder = { critical: 4, high: 3, moderate: 2, low: 1 };
  zones.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return zones.slice(0, 3);
}

/**
 * Convert BSFC-s score (0-30) to 0-100 scale for gauge display
 * @param score BSFC-s score (0-30)
 * @returns Score on 0-100 scale
 */
export function scoreToGauge(score: number): number {
  // Invert: higher BSFC score = worse burden = lower gauge score
  // 0 BSFC = 100 gauge (perfect wellbeing)
  // 30 BSFC = 0 gauge (severe burden)
  return Math.round(((30 - score) / 30) * 100);
}
