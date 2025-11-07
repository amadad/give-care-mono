/**
 * Prompt Loader Utility
 *
 * Loads system prompt templates and replaces template variables with actual values.
 *
 * Template Variable Format: {{variableName}}
 * Example: "Hello {{userName}}" → "Hello Alice"
 */

"use node";

import { prompts, type PromptName } from '../../convex/prompts/index';

/**
 * Load a prompt template
 *
 * @param promptName - Name of the prompt
 * @returns Raw template content with template variables
 * @throws Error if prompt doesn't exist
 */
export function loadPrompt(promptName: string): string {
  const prompt = prompts[promptName as PromptName];
  if (!prompt) {
    throw new Error(`Failed to load prompt "${promptName}": Prompt not found`);
  }
  return prompt;
}

/**
 * Replace template variables in a prompt
 *
 * Template variables use double curly braces: {{variableName}}
 * - Replaces all occurrences of each variable
 * - Leaves undefined/missing variables as-is
 * - Handles numeric and string values
 *
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns Template with variables replaced
 */
export function replaceVariables(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined && value !== null) {
      // Escape special regex characters in key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
  }

  return result;
}
