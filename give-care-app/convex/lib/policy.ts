/**
 * Policy utilities for intent classification and tone selection
 *
 * Migrated from src/policy/ for Convex-native usage.
 */

import type { AgentContext } from './types';

/**
 * Detect user intent from message text
 *
 * @param text - User message
 * @returns Intent classification: 'assessment', 'crisis', or 'respond'
 */
export const detectIntent = (text: string): 'assessment' | 'crisis' | 'respond' => {
  const lower = text.toLowerCase();

  // Check for assessment keywords
  if (lower.includes('assessment') || lower.includes('survey') || lower.includes('burnout test')) {
    return 'assessment';
  }

  // Check for crisis keywords
  // Note: Policy module filters these as "unsafe tokens" - this is a known issue
  // For now, we rely on crisisFlags in context for crisis detection
  if (['suicide', 'kill myself', 'end it', 'want to die'].some((term) => lower.includes(term))) {
    return 'crisis';
  }

  return 'respond';
};

/**
 * Get appropriate tone based on user context
 *
 * @param context - User context including crisis flags
 * @returns Tone instruction for LLM
 */
export const getTone = (context: AgentContext): string => {
  if (context.crisisFlags?.active) {
    return 'You are a crisis counselor. Respond with urgency, empathy, and clear next steps.';
  }

  return 'You are a compassionate caregiver. Respond with warmth, validation, and actionable care tips.';
};

/**
 * Check if crisis agent should be invoked
 *
 * @param context - User context
 * @returns True if crisis flags are active
 */
export const shouldInvokeCrisisAgent = (context: AgentContext): boolean => {
  return Boolean(context.crisisFlags?.active);
};

/**
 * Route user to appropriate agent based on intent and context
 *
 * @param text - User message
 * @param context - User context
 * @returns Agent name: 'crisis', 'assessment', or 'main'
 */
export const routeToAgent = (
  text: string,
  context: AgentContext
): 'crisis' | 'assessment' | 'main' => {
  // Crisis takes priority
  if (shouldInvokeCrisisAgent(context)) {
    return 'crisis';
  }

  const intent = detectIntent(text);

  if (intent === 'crisis') {
    return 'crisis';
  }

  if (intent === 'assessment') {
    return 'assessment';
  }

  return 'main';
};
