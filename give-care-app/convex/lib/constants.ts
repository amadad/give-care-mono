/**
 * Application Constants
 *
 * Centralized constants to prevent definition drift across modules.
 */

/**
 * Crisis keywords that trigger immediate crisis agent routing
 * and high-priority response workflows.
 */
export const CRISIS_TERMS = [
  'suicide',
  'kill myself',
  'end it',
  'want to die',
  'no point',
  'give up',
  'hurt myself',
] as const;
