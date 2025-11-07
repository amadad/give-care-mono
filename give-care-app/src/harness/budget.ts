import { Budget, HydratedContext } from '../shared/types';

const DEFAULT_BUDGETS: Record<string, Budget> = {
  main: { maxInputTokens: 2000, maxOutputTokens: 1000, maxTools: 2 },
  assessment: { maxInputTokens: 1500, maxOutputTokens: 700, maxTools: 2 },
  crisis: { maxInputTokens: 1000, maxOutputTokens: 400, maxTools: 1 },
};

export const getBudgetForAgent = (agent: string, ctx: HydratedContext): Budget => {
  if (ctx.budget) {
    return ctx.budget;
  }
  return DEFAULT_BUDGETS[agent] ?? DEFAULT_BUDGETS.main;
};
