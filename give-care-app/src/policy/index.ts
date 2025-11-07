import { loadPolicyBundles } from './loader';
import { PolicyDecision, PolicyRule } from './types';
import { HydratedContext, Inbound } from '../shared/types';

const bundles = loadPolicyBundles();

type CompiledRule = PolicyRule & {
  predicate: (input: Inbound, ctx: HydratedContext) => boolean;
};

const UNSAFE_TOKENS = ['constructor', 'require', 'global', 'process', 'Function', '=>', ';', '{', '}', '[', ']'];

const compileExpression = (expr: string) => {
  if (UNSAFE_TOKENS.some((token) => expr.includes(token))) {
    console.warn(`Policy expression contains unsafe token and will be ignored: ${expr}`);
    return () => false;
  }
  // eslint-disable-next-line no-new-func
  const fn = new Function('input', 'ctx', `"use strict";return (${expr});`);
  return (input: Inbound, ctx: HydratedContext) => {
    try {
      return Boolean(fn(input, ctx));
    } catch (err) {
      console.error('Policy expression failed', expr, err);
      return false;
    }
  };
};

const compiledBundles: Record<string, CompiledRule[]> = Object.entries(bundles).reduce(
  (acc, [name, bundle]) => {
    acc[name] = bundle.rules.map((rule) => ({ ...rule, predicate: compileExpression(rule.when) }));
    return acc;
  },
  {} as Record<string, CompiledRule[]>
);

const MESSAGE_TOKENS: Record<string, string> = {
  medical_disclaimer: 'I can share general support but not medical diagnoses. Please consult a clinician.',
};

const applyRuleAction = (decision: PolicyDecision, action: string) => {
  if (action.startsWith('route:')) {
    decision.routeOverride = action.split(':')[1] as PolicyDecision['routeOverride'];
  }
  if (action.startsWith('block_with_message:')) {
    decision.allow = false;
    const token = action.split(':')[1];
    decision.message = MESSAGE_TOKENS[token] ?? token;
  }
};

const evaluateBundle = (bundleName: string, input: Inbound, ctx: HydratedContext): PolicyDecision => {
  const rules = compiledBundles[bundleName] ?? [];
  const decision: PolicyDecision = { allow: true, actions: [] };
  for (const rule of rules) {
    if (rule.predicate(input, ctx)) {
      decision.actions.push({ ruleId: rule.id, action: rule.action });
      applyRuleAction(decision, rule.action);
    }
  }
  return decision;
};

const detectIntent = (text: string): 'assessment' | 'crisis' | 'respond' => {
  const lower = text.toLowerCase();
  if (lower.includes('assessment') || lower.includes('survey')) {
    return 'assessment';
  }
  if (['suicide', 'kill myself', 'end it'].some((term) => lower.includes(term))) {
    return 'crisis';
  }
  return 'respond';
};

const toneFromCtx = (ctx: HydratedContext) => {
  if (ctx.crisisFlags?.active) {
    return 'You are a crisis counselor. Respond with urgency, empathy, and clear next steps.';
  }
  return 'You are a compassionate caregiver. Respond with warmth, validation, and actionable care tips.';
};

export const policy = {
  evaluate: {
    pre: (input: Inbound, ctx: HydratedContext) => evaluateBundle(ctx.policyBundle, input, ctx),
    post: (input: Inbound, ctx: HydratedContext) => evaluateBundle(ctx.policyBundle, input, ctx),
  },
  intent: (text: string) => detectIntent(text),
  tone: (ctx: HydratedContext) => toneFromCtx(ctx),
};
