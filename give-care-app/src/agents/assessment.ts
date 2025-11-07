import { Agent } from './types';

type AssessmentScore = {
  total: number;
  band: string;
  explanation: string;
};

type Intervention = {
  title: string;
};

export const assessmentAgent: Agent = {
  name: 'assessment',
  preconditions: () => true,
  async plan() {
    return 'assess';
  },
  async *run(_input, ctx, caps, _budget) {
    const answers = (ctx.metadata.assessmentAnswers as any[]) ?? [];
    const definitionId = ctx.lastAssessment?.definitionId ?? 'burnout_v1';
    const score = await caps.invoke<unknown, AssessmentScore>('assessment.score', { definitionId, answers });
    const message = `Your assessment score is ${score.total} (${score.band}). ${score.explanation}`;
    yield message;
    if (score.band !== 'low') {
      const interventions = await caps.invoke<unknown, Intervention[]>('interventions.suggest', {
        pressureZone: ctx.metadata.pressureZone ?? 'work',
      });
      yield `Recommended next steps: ${interventions.map((i) => i.title).join(', ')}`;
    }
  },
};
