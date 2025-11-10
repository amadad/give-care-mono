/**
 * Shared agent configuration
 * Defaults for all agents in the system
 */

import { openai } from '@ai-sdk/openai';

export const defaultAgentConfig = {
  languageModel: openai('gpt-5-nano'),
  // Add shared settings here (usage tracking, etc.)
} as const;

export const channelValidator = {
  sms: 'sms' as const,
  email: 'email' as const,
  web: 'web' as const,
};
