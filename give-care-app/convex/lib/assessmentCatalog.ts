const DAY_MS = 24 * 60 * 60 * 1000;

export type AssessmentSlug = 'ema' | 'bsfc' | 'reach2' | 'sdoh';

export type AssessmentAnswer = {
  questionIndex: number;
  value: number; // 1-5 Likert
};

export type AssessmentCatalogEntry = {
  title: string;
  items: Array<{ id: number; text: string; weight?: number }>;
  length: number;
  cooldownMs: number;
  zoneBuckets?: Record<string, number[]>;
  score: (_answers: AssessmentAnswer[]) => {
    score: number;
    band: string;
    pressureZones: string[];
  };
};

export type ScoreDetails = {
  composite: number;                // 0-100
  band: string;                     // very_low | low | moderate | high
  pressureZones: string[];          // as today
  zoneAverages: Record<string, number>; // per zone (e.g., emotional: 3.8)
  confidence: number;               // 0..1 based on answered/length
};

const clampLikert = (value: number) => Math.min(5, Math.max(1, value));

const sumScores = (
  answers: AssessmentAnswer[],
  buckets: Record<string, number[]>
): { totals: Record<string, number>; count: Record<string, number> } => {
  const totals: Record<string, number> = {};
  const count: Record<string, number> = {};
  for (const [zone, indexes] of Object.entries(buckets)) {
    totals[zone] = 0;
    count[zone] = 0;
    for (const idx of indexes) {
      const answer = answers.find((a) => a.questionIndex === idx);
      if (!answer) continue;
      totals[zone] += clampLikert(answer.value);
      count[zone] += 1;
    }
  }
  return { totals, count };
};

const bandFromAverage = (avg: number): string => {
  if (avg < 2) return 'very_low';
  if (avg < 3) return 'low';
  if (avg < 4) return 'moderate';
  return 'high';
};

const pressureZonesFromBuckets = (
  averages: Record<string, number>,
  threshold = 3.5
) =>
  Object.entries(averages)
    .filter(([, avg]) => avg >= threshold)
    .map(([zone]) => zone);

const createCatalogEntry = (
  title: string,
  questions: string[],
  cooldownDays: number,
  zoneBuckets: Record<string, number[]>
): AssessmentCatalogEntry => ({
  title,
  items: questions.map((text, idx) => ({ id: idx, text })),
  length: questions.length,
  cooldownMs: cooldownDays * DAY_MS,
  zoneBuckets,
  score: (answers: AssessmentAnswer[]) => {
    const { totals, count } = sumScores(answers, zoneBuckets);
    const averages: Record<string, number> = {};
    let grandTotal = 0;
    let grandCount = 0;
    for (const zone of Object.keys(zoneBuckets)) {
      if (!count[zone]) {
        averages[zone] = 0;
        continue;
      }
      averages[zone] = totals[zone] / count[zone];
      grandTotal += totals[zone];
      grandCount += count[zone];
    }
    const avgScore = grandCount ? grandTotal / grandCount : 0;
    return {
      score: Math.round(avgScore * 20), // normalize to 0-100 scale
      band: bandFromAverage(avgScore),
      pressureZones: pressureZonesFromBuckets(averages),
    };
  },
});

const emaQuestions = [
  'On a scale of 1-5, how stressed are you right now? (Reply "skip" to move on)',
  'Energy check: 1 (empty) to 5 (fully charged)? (Reply "skip" to move on)',
  'How supported did you feel today? 1 (not at all) - 5 (fully). (Reply "skip" to move on)',
];

const bsfcQuestions = [
  'I feel emotionally drained caregiving.',
  'I have little time for myself.',
  'My physical health has suffered.',
  'I feel guilty when I take breaks.',
  'I struggle to balance work and caregiving.',
  'I do not sleep well because of caregiving.',
  'I feel isolated from friends or family.',
  'I worry about finances due to caregiving.',
  'I feel overwhelmed by the demands on my time.',
  'I do not know where to get extra help.',
];

const reachQuestions = [
  'I feel tense while helping my loved one.',
  'I have enough energy for daily tasks.',
  'I feel appreciated by others.',
  'I have someone to talk to about stress.',
  'I feel confident handling medical tasks.',
  'I have difficulty sleeping.',
  'I feel sad or depressed.',
  'I feel the caregiving load is unfair.',
  'I have enough information about resources.',
  'I feel anxious about the future.',
  'I can keep up with appointments and paperwork.',
  'I feel respected by clinicians.',
  'I can find respite care when needed.',
  'I feel spiritually supported.',
  'I have time for hobbies or wellness.',
  'I feel optimistic most days.',
];

const sdohQuestions = [
  'It is easy to afford medications and supplies.',
  'Transportation is available for appointments.',
  'We have access to healthy food nearby.',
  'Our home is safe for caregiving needs.',
  'Utilities and internet are reliable.',
  'Insurance coverage meets our needs.',
  'I can take paid leave when needed.',
  'Legal paperwork (POA, etc.) is in order.',
  'Childcare/eldercare backup is available.',
  'I can access counseling or support groups.',
  'Language or cultural barriers are low.',
  'Local community services are responsive.',
  'I feel respected when seeking help.',
  'Emergency funds are available if needed.',
  'I know how to reach crisis resources quickly.',
  'Technology (phone/PC) works reliably.',
  'Neighbors/friends can help in a pinch.',
  'Care recipient\'s providers coordinate well.',
  'I understand the care plan and meds clearly.',
  'I can restock supplies without long delays.',
  'I feel safe walking in my neighborhood.',
  'We can manage rent/mortgage comfortably.',
  'Insurance paperwork is manageable.',
  'I can access spiritual or faith support.',
  'There are quiet spaces for decompression.',
  'We receive respite vouchers or subsidies.',
  'My employer is flexible with caregiving needs.',
  'I can reach a social worker when needed.',
];

const zoneBuckets = (mapping: Record<string, number[]>) => mapping;

export const CATALOG: Record<AssessmentSlug, AssessmentCatalogEntry> = {
  ema: createCatalogEntry(
    'Ecological Momentary Assessment (EMA)',
    emaQuestions,
    1,
    zoneBuckets({
      emotional: [0],
      physical: [1],
      social: [2],
    })
  ),
  bsfc: createCatalogEntry(
    'Burden Scale for Family Caregivers (BSFC)',
    bsfcQuestions,
    14,
    zoneBuckets({
      emotional: [0, 3, 7],
      time: [1, 4, 8],
      physical: [2, 5],
      social: [6, 9],
      financial: [7],
    })
  ),
  reach2: createCatalogEntry(
    'REACH-II Caregiver Strain',
    reachQuestions,
    21,
    zoneBuckets({
      emotional: [0, 6, 9, 13, 15],
      time: [1, 10],
      social: [2, 3, 11],
      informational: [4, 8, 12],
      spiritual: [14],
    })
  ),
  sdoh: createCatalogEntry(
    'SDOH Caregiver Access Scan',
    sdohQuestions,
    30,
    zoneBuckets({
      financial: [0, 5, 20, 21],
      transportation: [1, 6, 12],
      housing: [3, 4, 7, 22],
      community: [10, 11, 15, 23, 27],
      clinical: [8, 13, 18, 25, 28],
    })
  ),
};

/**
 * Compute score with detailed zone averages and confidence
 * Used for creating scores table records
 */
export function scoreWithDetails(
  definition: AssessmentSlug,
  answers: AssessmentAnswer[]
): ScoreDetails {
  const catalog = CATALOG[definition];
  const { score, band, pressureZones } = catalog.score(answers);
  
  // Compute zone averages (reuse existing sumScores logic)
  const buckets = catalog.zoneBuckets || {};
  const { totals, count } = sumScores(answers, buckets);
  const zoneAverages: Record<string, number> = {};
  
  for (const zone of Object.keys(buckets)) {
    if (!count[zone]) {
      zoneAverages[zone] = 0;
      continue;
    }
    zoneAverages[zone] = totals[zone] / count[zone];
  }
  
  // Confidence based on answered questions vs total
  const confidence = answers.length / catalog.length;
  
  return {
    composite: score,
    band,
    pressureZones,
    zoneAverages,
    confidence: Math.min(1, Math.max(0, confidence)),
  };
}

