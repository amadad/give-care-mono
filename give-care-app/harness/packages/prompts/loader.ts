import { prompts, type PromptName } from './index';

export const loadPrompt = (name: PromptName) => prompts[name];

export const renderPrompt = (template: string, variables: Record<string, string | number | undefined>) => {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return acc.replace(new RegExp(`\\{\\{${escaped}\\}\\}`, 'g'), String(value));
  }, template);
};
