/**
 * Prompt Loader Utility
 *
 * Loads system prompt templates from markdown files and replaces
 * template variables with actual values.
 *
 * Template Variable Format: {{variableName}}
 * Example: "Hello {{userName}}" → "Hello Alice"
 */

"use node";

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load a prompt template from markdown file
 *
 * @param promptName - Name of the prompt file (without .md extension)
 * @returns Raw template content with template variables
 * @throws Error if file doesn't exist or can't be read
 */
export function loadPrompt(promptName: string): string {
  try {
    const filePath = join(__dirname, `${promptName}.md`);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to load prompt "${promptName}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
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
