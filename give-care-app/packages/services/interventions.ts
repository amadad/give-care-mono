export type Intervention = {
  id: string;
  title: string;
  description: string;
  score: number;
};

export type InterventionRequest = {
  pressureZone: 'work' | 'home' | 'health';
};

const CATALOG: Record<InterventionRequest['pressureZone'], Intervention[]> = {
  work: [
    { id: 'microbreak', title: 'Micro breaks', description: '3-min reset exercises', score: 0.9 },
    { id: 'focusboundaries', title: 'Focus boundaries', description: 'Block focused time', score: 0.7 },
  ],
  home: [
    { id: 'family_signal', title: 'Family signal', description: 'Shared cues for support', score: 0.85 },
  ],
  health: [
    { id: 'breathing', title: 'Breathing exercise', description: 'Box breathing guide', score: 0.8 },
  ],
};

export const rankInterventions = (req: InterventionRequest): Intervention[] => {
  return [...(CATALOG[req.pressureZone] ?? [])].sort((a, b) => b.score - a.score);
};
