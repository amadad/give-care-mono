import { Agent } from './types';
import { policy } from '../policy';
import { HydratedContext } from '../shared/types';
import { loadPrompt, renderPrompt } from '../prompts/loader';

const MAIN_PROMPT = loadPrompt('main');

const buildLLMContext = (ctx: HydratedContext) => ({
  userId: ctx.userId,
  sessionId: ctx.sessionId,
  locale: ctx.locale,
  policyBundle: ctx.policyBundle,
  consent: ctx.consent,
  crisisFlags: ctx.crisisFlags ?? null,
  promptHistory: ctx.promptHistory,
  metadata: ctx.metadata,
});

const promptVariables = (ctx: HydratedContext) => {
  const metadata = (ctx.metadata ?? {}) as Record<string, unknown>;
  const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
  return {
    userName: (profile.firstName as string) ?? 'caregiver',
    relationship: (profile.relationship as string) ?? 'caregiver',
    careRecipient: (profile.careRecipientName as string) ?? 'your loved one',
    journeyPhase: (metadata.journeyPhase as string) ?? 'active',
    totalInteractionCount: String((metadata.totalInteractionCount as number) ?? 0),
    wellnessInfo: metadata.wellnessInfo as string | undefined,
    profileComplete: String(Boolean(metadata.profileComplete)),
    missingFieldsSection: metadata.missingFieldsSection as string | undefined,
  };
};

export const mainAgent: Agent = {
  name: 'main',
  preconditions: () => true,
  async plan(input) {
    const intent = policy.intent(input.text);
    if (intent === 'assessment') return 'assess';
    if (intent === 'crisis') return 'escalate';
    return 'respond';
  },
  async *run(input, ctx, _caps, budget, deps) {
    const systemPrompt = `${renderPrompt(MAIN_PROMPT, promptVariables(ctx))}\n\n${policy.tone(ctx)}`;
    const stream = deps.model.stream({
      system: systemPrompt,
      user: input.text,
      context: buildLLMContext(ctx),
      budget: { maxInput: budget.maxInputTokens, maxOutput: budget.maxOutputTokens },
      tools: deps.tools,
      onToolCall: deps.invokeTool,
    });
    for await (const chunk of stream) {
      yield chunk;
    }
  },
};
