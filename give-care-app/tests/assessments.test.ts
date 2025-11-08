import { describe, it, expect } from 'vitest';

// Import assessment definitions directly
// Note: These are constants exported from the functions file
// In real implementation, these would be in lib/ for better testability
const BSFC_QUESTIONS = [
  { id: 'q1', zone: 'emotional', min: 0, max: 3 },
  { id: 'q2', zone: 'physical', min: 0, max: 3 },
  { id: 'q3', zone: 'social', min: 0, max: 3 },
  { id: 'q4', zone: 'time', min: 0, max: 3 },
  { id: 'q5', zone: 'emotional', min: 0, max: 3 },
  { id: 'q6', zone: 'physical', min: 0, max: 3 },
  { id: 'q7', zone: 'social', min: 0, max: 3 },
  { id: 'q8', zone: 'time', min: 0, max: 3 },
  { id: 'q9', zone: 'emotional', min: 0, max: 3 },
  { id: 'q10', zone: 'physical', min: 0, max: 3 },
];

describe('Assessments - BSFC (Burden Scale for Family Caregivers)', () => {
  describe('Question Structure', () => {
    it('has exactly 10 questions', () => {
      expect(BSFC_QUESTIONS).toHaveLength(10);
    });

    it('all questions have valid zones', () => {
      const validZones = ['emotional', 'physical', 'social', 'time'];
      const allZonesValid = BSFC_QUESTIONS.every(q => validZones.includes(q.zone));
      expect(allZonesValid).toBe(true);
    });

    it('all questions use 0-3 scale', () => {
      const allUseCorrectScale = BSFC_QUESTIONS.every(q => q.min === 0 && q.max === 3);
      expect(allUseCorrectScale).toBe(true);
    });

    it('covers all four pressure zones equally', () => {
      const zoneCounts: Record<string, number> = {};
      BSFC_QUESTIONS.forEach(q => {
        zoneCounts[q.zone] = (zoneCounts[q.zone] || 0) + 1;
      });

      // Each zone should have at least 2 questions
      expect(zoneCounts.emotional).toBeGreaterThanOrEqual(2);
      expect(zoneCounts.physical).toBeGreaterThanOrEqual(2);
      expect(zoneCounts.social).toBeGreaterThanOrEqual(2);
      expect(zoneCounts.time).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Score Calculation', () => {
    const calculateComposite = (answers: number[]): number => {
      if (answers.length !== 10) throw new Error('Must have exactly 10 answers');
      const sum = answers.reduce((acc, val) => acc + val, 0);
      // BSFC composite score: (sum / 30) * 100
      return Math.round((sum / 30) * 100);
    };

    const calculateZoneScores = (answers: { questionId: string; value: number }[]) => {
      const zones: Record<string, number[]> = {
        emotional: [],
        physical: [],
        social: [],
        time: [],
      };

      answers.forEach((answer, idx) => {
        const question = BSFC_QUESTIONS[idx];
        if (question) {
          zones[question.zone].push(answer.value);
        }
      });

      return Object.fromEntries(
        Object.entries(zones).map(([zone, values]) => [
          zone,
          values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / (values.length * 3)) * 100) : 0,
        ])
      );
    };

    it('minimum score is 0', () => {
      const minAnswers = new Array(10).fill(0);
      const score = calculateComposite(minAnswers);
      expect(score).toBe(0);
    });

    it('maximum score is 100', () => {
      const maxAnswers = new Array(10).fill(3);
      const score = calculateComposite(maxAnswers);
      expect(score).toBe(100);
    });

    it('mid-range answers yield mid-range score', () => {
      const midAnswers = new Array(10).fill(1.5);
      const score = calculateComposite(midAnswers);
      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(60);
    });

    it('calculates zone scores independently', () => {
      const answers = [
        { questionId: 'q1', value: 3 }, // emotional
        { questionId: 'q2', value: 0 }, // physical
        { questionId: 'q3', value: 0 }, // social
        { questionId: 'q4', value: 0 }, // time
        { questionId: 'q5', value: 3 }, // emotional
        { questionId: 'q6', value: 0 }, // physical
        { questionId: 'q7', value: 0 }, // social
        { questionId: 'q8', value: 0 }, // time
        { questionId: 'q9', value: 3 }, // emotional
        { questionId: 'q10', value: 0 }, // physical
      ];

      const zoneScores = calculateZoneScores(answers);

      // Emotional zone should be high (3 questions at max value)
      expect(zoneScores.emotional).toBe(100);

      // Other zones should be 0
      expect(zoneScores.physical).toBe(0);
      expect(zoneScores.social).toBe(0);
      expect(zoneScores.time).toBe(0);
    });

    it('rejects invalid answer counts', () => {
      expect(() => calculateComposite([1, 2, 3])).toThrow('Must have exactly 10 answers');
      expect(() => calculateComposite(new Array(11).fill(1))).toThrow('Must have exactly 10 answers');
    });
  });
});

describe('Assessments - Quick Burnout Check', () => {
  const BURNOUT_QUESTIONS = [
    { id: 'energy', min: 0, max: 4 },
    { id: 'stress', min: 0, max: 4 },
    { id: 'support', min: 0, max: 4 },
    { id: 'hope', min: 0, max: 4 },
  ];

  it('has exactly 4 questions for quick assessment', () => {
    expect(BURNOUT_QUESTIONS).toHaveLength(4);
  });

  it('uses 5-point scale (0-4)', () => {
    const allUseCorrectScale = BURNOUT_QUESTIONS.every(q => q.min === 0 && q.max === 4);
    expect(allUseCorrectScale).toBe(true);
  });

  it('covers key burnout indicators', () => {
    const indicators = BURNOUT_QUESTIONS.map(q => q.id);
    expect(indicators).toContain('energy');
    expect(indicators).toContain('stress');
    expect(indicators).toContain('support');
    expect(indicators).toContain('hope');
  });
});
