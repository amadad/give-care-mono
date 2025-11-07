import { hydrateContext, persistContext } from './context';
import { policy } from '../policy';
import { Inbound, HydratedContext } from '../shared/types';
import { runtime } from './runtime';
import { agentRegistry } from '../agents/registry';
import { getBudgetForAgent } from './budget';
import { createCapabilityRuntime } from '../capabilities/runtime';
import { createTrace } from '../shared/tracing';
import { BudgetExceededError } from '../shared/errors';
import type { Agent } from '../agents/types';

const selectAgentFromPlan = (initial: Agent, planResult: Awaited<ReturnType<Agent['plan']>>): Agent => {
  if (planResult === 'assess') return agentRegistry.get('assessment');
  if (planResult === 'escalate') return agentRegistry.get('crisis');
  return initial;
};

export const handle = async (input: Inbound) => {
  const trace = createTrace({ id: `trace-${Date.now()}` });
  await runtime.store.saveInbound({ input, traceId: trace.id });

  const ctx = await hydrateContext(input);
  trace.push('context.hydrated', { userId: ctx.userId });

  const decision = policy.evaluate.pre(input, ctx);
  if (!decision.allow) {
    await runtime.store.logGuardrail({
      ruleId: decision.actions.at(-1)?.ruleId ?? 'unknown',
      action: decision.actions.at(-1)?.action ?? 'block',
      context: { message: decision.message },
      traceId: trace.id,
      userId: input.userId,
    });
    return { type: 'policy_block', message: decision.message ?? 'Turn blocked by policy.' };
  }

  let agent = agentRegistry.get(decision.routeOverride ?? 'main');
  const planResult = await agent.plan(input, ctx);
  agent = selectAgentFromPlan(agent, planResult);
  trace.push('agent.selected', { agent: agent.name, planResult });

  const budget = getBudgetForAgent(agent.name, ctx);
  let toolCalls = 0;
  const capabilities = createCapabilityRuntime(
    { userId: ctx.userId, context: ctx, trace, budget },
    {
      onInvoke: ({ name }) => {
        toolCalls += 1;
        trace.push('tool.invoke', { name });
      },
    }
  );
  const toolSpecs = capabilities.list().map((cap) => ({
    name: cap.name,
    description: cap.description ?? cap.name,
    schema: cap.io?.input,
  }));

  const deps = {
    model: runtime.model,
    policy,
    tools: toolSpecs,
    invokeTool: (name: string, args: unknown) => capabilities.invoke(name, args),
  } as const;

  const chunks: string[] = [];
  const startedAt = Date.now();

  try {
    for await (const chunk of agent.run(input, ctx, capabilities, budget, deps)) {
      chunks.push(chunk);
      trace.push('stream.chunk', { size: chunk.length });
      await runtime.store.saveOutbound({ userId: input.userId, channel: input.channel, text: chunk, traceId: trace.id });
    }
    const latencyMs = Date.now() - startedAt;
    await runtime.store.logAgentRun({
      agent: agent.name,
      userId: input.userId,
      policyBundle: ctx.policyBundle,
      result: { usedInputTokens: 0, usedOutputTokens: 0, toolCalls },
      traceId: trace.id,
      latencyMs,
    });
  } catch (error) {
    trace.push('agent.error', { message: (error as Error).message });
    if (error instanceof BudgetExceededError) {
      throw error;
    }
    throw error;
  } finally {
    await persistContext(ctx);
    const postDecision = policy.evaluate.post(input, ctx);
    if (!postDecision.allow) {
      await runtime.store.logGuardrail({
        ruleId: postDecision.actions.at(-1)?.ruleId ?? 'unknown',
        action: postDecision.actions.at(-1)?.action ?? 'block',
        context: { phase: 'post', message: postDecision.message },
        traceId: trace.id,
        userId: input.userId,
      });
    }
  }

  return { type: 'stream', chunks };
};
