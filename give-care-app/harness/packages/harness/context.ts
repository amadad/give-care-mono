import { runtime } from './runtime';
import { HydratedContext, Inbound } from '../shared/types';

export const hydrateContext = async (input: Inbound): Promise<HydratedContext> => {
  return runtime.store.hydrateContext(input);
};

export const persistContext = async (ctx: HydratedContext) => {
  await runtime.store.persistContext(ctx);
};
