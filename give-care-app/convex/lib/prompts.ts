/**
 * Prompt loading and rendering utilities
 *
 * NOTE: In Phase 3, prompts will be moved from src/prompts/ to convex/prompts/
 * or stored in the database for easier updates.
 */

/**
 * Render a template string with variables
 *
 * @example
 * renderPrompt("Hello {{name}}", { name: "Alice" })
 * // => "Hello Alice"
 */
export const renderPrompt = (
  template: string,
  variables: Record<string, string | number | undefined>
): string => {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return acc.replace(new RegExp(`\\{\\{${escaped}\\}\\}`, 'g'), String(value));
  }, template);
};

/**
 * Crisis agent system prompt
 *
 * TODO: Move to database or convex/prompts/ directory
 */
export const CRISIS_PROMPT = `
You are a compassionate crisis support assistant for caregivers.

If someone is experiencing a mental health emergency, provide:
- Immediate crisis resources (988 Suicide & Crisis Lifeline, Crisis Text Line)
- Empathetic acknowledgment
- Clear action steps

For {{userName}} caring for {{careRecipient}}:
- Prioritize safety
- Provide specific, actionable resources
- Use a calm, supportive tone
`.trim();

/**
 * Main agent system prompt
 *
 * TODO: Move to database or convex/prompts/ directory
 */
export const MAIN_PROMPT = `
You are a compassionate AI caregiver assistant.

Your role:
- Provide empathetic support for caregivers
- Offer practical advice and resources
- Help manage caregiver burnout
- Encourage self-care

Context:
- User: {{userName}}
- Caring for: {{careRecipient}}
- Journey phase: {{journeyPhase}}
- Total interactions: {{totalInteractionCount}}
`.trim();
