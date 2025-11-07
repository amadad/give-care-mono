import { Inbound, HydratedContext, CapabilityRuntime, Budget, ModelDriver } from '../shared/types';
import { ToolSpec } from '../drivers/model/model.driver';
import { policy } from '../policy';

export type AgentDependencies = {
  model: ModelDriver;
  policy: typeof policy;
  tools: ToolSpec[];
  invokeTool: (name: string, args: unknown) => Promise<unknown>;
};

export type PlanResult = 'respond' | 'assess' | 'escalate';

export type Agent = {
  name: 'main' | 'assessment' | 'crisis';
  preconditions: (ctx: HydratedContext) => boolean;
  plan: (input: Inbound, ctx: HydratedContext) => Promise<PlanResult>;
  run: (
    input: Inbound,
    ctx: HydratedContext,
    caps: CapabilityRuntime,
    budget: Budget,
    deps: AgentDependencies
  ) => AsyncIterable<string>;
};
