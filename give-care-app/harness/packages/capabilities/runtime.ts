import { capabilityRegistry } from './registry';
import { CapabilityRuntime, CapabilityContext, HydratedContext, Budget, Trace } from '../shared/types';
import { CapabilityNotFoundError, ConsentRequiredError, BudgetExceededError } from '../shared/errors';
import { runtime } from '../harness/runtime';
import { services as serviceModules } from '../services';

export type CapabilityRuntimeFactoryInput = {
  userId: string;
  context: HydratedContext;
  trace: Trace;
  budget: Budget;
};

export type CapabilityRuntimeOptions = {
  onInvoke?: (meta: { name: string }) => void;
};

const buildContext = (input: CapabilityRuntimeFactoryInput): CapabilityContext => ({
  userId: input.userId,
  store: runtime.store,
  services: serviceModules,
  trace: input.trace,
  budget: input.budget,
  context: input.context,
  scheduler: runtime.scheduler,
});

export const createCapabilityRuntime = (
  input: CapabilityRuntimeFactoryInput,
  options: CapabilityRuntimeOptions = {}
): CapabilityRuntime => {
  const ctx = buildContext(input);
  let toolCalls = 0;
  return {
    ...capabilityRegistry,
    async invoke(name, args) {
      if (toolCalls >= ctx.budget.maxTools) {
        throw new BudgetExceededError(`Tool budget exceeded for ${name}`);
      }
      const capability = capabilityRegistry.get(name);
      if (!capability) throw new CapabilityNotFoundError(name);
      if (capability.requiresConsent && !ctx.context.consent?.emergency) {
        throw new ConsentRequiredError(name);
      }
      if (capability.io?.input) {
        capability.io.input.parse(args);
      }
      const result = await capability.run(args, ctx);
      toolCalls += 1;
      options.onInvoke?.({ name });
      return result;
    },
  };
};
