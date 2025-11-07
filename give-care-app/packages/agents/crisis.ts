import { Agent } from './types';
import { policy } from '../policy';
import { HydratedContext } from '../shared/types';
import { loadPrompt, renderPrompt } from '../prompts/loader';

const CRISIS_PROMPT = loadPrompt('crisis');

const buildLLMContext = (ctx: HydratedContext, channel: string) => ({
  userId: ctx.userId,
  sessionId: ctx.sessionId,
  locale: ctx.locale,
  crisisFlags: ctx.crisisFlags ?? null,
  channel,
  consent: ctx.consent,
  metadata: ctx.metadata,
});

export const crisisAgent: Agent = {
  name: 'crisis',
  preconditions: (ctx) => Boolean(ctx.crisisFlags?.active),
  async plan() {
    return 'escalate';
  },
  async *run(input, ctx, _caps, budget, deps) {
    const metadata = (ctx.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
    const instructions = `${renderPrompt(CRISIS_PROMPT, {
      userName: (profile.firstName as string) ?? 'friend',
      careRecipient: (profile.careRecipientName as string) ?? 'loved one',
    })}\n\n${policy.tone(ctx)}`;
    const stream = deps.model.stream({
      system: instructions,
      user: input.text,
      context: { ...buildLLMContext(ctx, input.channel), tone: policy.tone(ctx) },
      budget: { maxInput: budget.maxInputTokens, maxOutput: budget.maxOutputTokens },
      tools: deps.tools,
      onToolCall: deps.invokeTool,
    });
    for await (const chunk of stream) {
      yield chunk;
    }
  },
};
