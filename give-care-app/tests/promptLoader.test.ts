/**
 * Prompt Loader Tests
 *
 * REQUIREMENT: Extract system prompts from TypeScript to markdown files
 * for better readability, version control, and maintainability.
 *
 * Tests the loader utility that reads markdown files and replaces
 * template variables ({{userName}}, {{careRecipient}}, etc.)
 */

import { describe, test, expect } from 'vitest';
import { loadPrompt, replaceVariables } from '../src/prompts/loader';

describe('Prompt Loader', () => {
  describe('loadPrompt', () => {
    test('loads main_agent.md successfully', () => {
      const prompt = loadPrompt('main_agent');
      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('GiveCare');
    });

    test('loads crisis_agent.md successfully', () => {
      const prompt = loadPrompt('crisis_agent');
      expect(prompt).toBeTruthy();
      expect(prompt).toContain('crisis support');
    });

    test('loads assessment_agent.md successfully', () => {
      const prompt = loadPrompt('assessment_agent');
      expect(prompt).toBeTruthy();
      expect(prompt).toContain('assessment');
    });

    test('throws error for non-existent prompt file', () => {
      expect(() => loadPrompt('non_existent')).toThrow();
    });
  });

  describe('replaceVariables', () => {
    test('replaces single variable', () => {
      const template = 'Hello {{userName}}!';
      const result = replaceVariables(template, { userName: 'Alice' });
      expect(result).toBe('Hello Alice!');
    });

    test('replaces multiple variables', () => {
      const template = 'User: {{userName}}, Recipient: {{careRecipient}}';
      const result = replaceVariables(template, {
        userName: 'Alice',
        careRecipient: 'Bob',
      });
      expect(result).toBe('User: Alice, Recipient: Bob');
    });

    test('replaces same variable multiple times', () => {
      const template = '{{userName}} is caring for loved one. {{userName}} needs support.';
      const result = replaceVariables(template, { userName: 'Alice' });
      expect(result).toBe('Alice is caring for loved one. Alice needs support.');
    });

    test('handles missing variables by leaving placeholder', () => {
      const template = 'Hello {{userName}}!';
      const result = replaceVariables(template, {});
      expect(result).toBe('Hello {{userName}}!');
    });

    test('handles undefined variables by leaving placeholder', () => {
      const template = 'Hello {{userName}}!';
      const result = replaceVariables(template, { userName: undefined });
      expect(result).toBe('Hello {{userName}}!');
    });

    test('handles numeric values', () => {
      const template = 'Score: {{burnoutScore}}/100';
      const result = replaceVariables(template, { burnoutScore: 75 });
      expect(result).toBe('Score: 75/100');
    });

    test('handles no variables in template', () => {
      const template = 'No variables here';
      const result = replaceVariables(template, { userName: 'Alice' });
      expect(result).toBe('No variables here');
    });

    test('preserves whitespace and newlines', () => {
      const template = 'Line 1\n{{userName}}\n  Indented line';
      const result = replaceVariables(template, { userName: 'Alice' });
      expect(result).toBe('Line 1\nAlice\n  Indented line');
    });

    test('handles empty string template', () => {
      const template = '';
      const result = replaceVariables(template, { userName: 'Alice' });
      expect(result).toBe('');
    });

    test('handles variables with special regex characters', () => {
      const template = 'Hello {{user.name}}!';
      const result = replaceVariables(template, { 'user.name': 'Alice' });
      expect(result).toBe('Hello Alice!');
    });
  });

  describe('Integration - Prompt Templates', () => {
    test('main agent prompt contains expected template variables', () => {
      const prompt = loadPrompt('main_agent');
      expect(prompt).toContain('{{userName}}');
      expect(prompt).toContain('{{careRecipient}}');
      expect(prompt).toContain('{{relationship}}');
    });

    test('crisis agent prompt contains expected template variables', () => {
      const prompt = loadPrompt('crisis_agent');
      expect(prompt).toContain('{{userName}}');
    });

    test('assessment agent prompt contains expected template variables', () => {
      const prompt = loadPrompt('assessment_agent');
      expect(prompt).toContain('{{userName}}');
      expect(prompt).toContain('{{assessmentName}}');
    });

    test('main agent prompt contains trauma-informed principles', () => {
      const prompt = loadPrompt('main_agent');
      expect(prompt).toContain('Trauma-Informed Principles');
      expect(prompt).toContain('P1:');
      expect(prompt).toContain('P2:');
      expect(prompt).toContain('P3:');
      expect(prompt).toContain('P4:');
      expect(prompt).toContain('P5:');
      expect(prompt).toContain('P6:');
    });

    test('all agent prompts contain seamless handoff rule', () => {
      const mainPrompt = loadPrompt('main_agent');
      const crisisPrompt = loadPrompt('crisis_agent');
      const assessmentPrompt = loadPrompt('assessment_agent');

      expect(mainPrompt).toContain('NEVER announce yourself');
      expect(crisisPrompt).toContain('NEVER announce yourself');
      expect(assessmentPrompt).toContain('NEVER announce yourself');
    });
  });

  describe('Backward Compatibility', () => {
    test('replaced prompt matches original instruction format', () => {
      const prompt = loadPrompt('main_agent');
      const replaced = replaceVariables(prompt, {
        userName: 'Alice',
        careRecipient: 'Bob',
        relationship: 'daughter',
        journeyPhase: 'active',
        totalInteractionCount: 5,
        wellnessInfo: 'Current wellness: 65/100 (Moderate Strain)',
        profileComplete: 'Yes',
        missingFieldsSection: '',
      });

      // Should contain key sections from original mainInstructions
      expect(replaced).toContain('You are GiveCare');
      expect(replaced).toContain('Alice');
      expect(replaced).toContain('Bob');
      expect(replaced).toContain('daughter');
      expect(replaced).toContain('One Thing At A Time');
    });
  });
});
