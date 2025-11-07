import { Agent } from './types';

export const assessmentAgent: Agent = {
  name: 'assessment',
  preconditions: () => true,
  async plan() {
    return 'assess';
  },
  async *run(_input, ctx, caps, budget) {
    const answers = (ctx.metadata.assessmentAnswers as any[]) ?? [];
    const definitionId = ctx.lastAssessment?.definitionId ?? 'burnout_v1';
    const score = await caps.invoke('assessment.score', { definitionId, answers });
    const message = `Your assessment score is ${score.total} (${score.band}). ${score.explanation}`;
    yield message;
    if (score.band !== 'low') {
      const interventions = await caps.invoke('interventions.suggest', {
        pressureZone: ctx.metadata.pressureZone ?? 'work',
      });
      yield `Recommended next steps: ${interventions.map((i: { title: string }) => i.title).join(', ')}`;
    }
  },
};
