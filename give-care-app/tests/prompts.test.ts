import { describe, it, expect } from 'vitest';
import {
  renderPrompt,
  CRISIS_PROMPT,
  MAIN_PROMPT,
  ASSESSMENT_PROMPT,
} from '../convex/lib/prompts';

describe('Prompt Rendering', () => {
  describe('renderPrompt', () => {
    it('replaces single variable', () => {
      const template = 'Hello {{name}}';
      const result = renderPrompt(template, { name: 'Alice' });
      expect(result).toBe('Hello Alice');
    });

    it('replaces multiple variables', () => {
      const template = '{{userName}} caring for {{careRecipient}}';
      const result = renderPrompt(template, {
        userName: 'Bob',
        careRecipient: 'Mom',
      });
      expect(result).toBe('Bob caring for Mom');
    });

    it('handles numeric values', () => {
      const template = 'Score: {{score}}';
      const result = renderPrompt(template, { score: 42 });
      expect(result).toBe('Score: 42');
    });

    it('ignores undefined variables', () => {
      const template = 'Hello {{name}}, age {{age}}';
      const result = renderPrompt(template, { name: 'Alice', age: undefined });
      expect(result).toBe('Hello Alice, age {{age}}');
    });

    it('handles variables with special regex characters', () => {
      const template = 'Value: {{$price}}';
      const result = renderPrompt(template, { $price: 100 });
      expect(result).toBe('Value: 100');
    });
  });

  describe('CRISIS_PROMPT', () => {
    it('contains crisis resources', () => {
      expect(CRISIS_PROMPT).toContain('988');
      expect(CRISIS_PROMPT).toContain('Crisis');
    });

    it('has userName and careRecipient placeholders', () => {
      expect(CRISIS_PROMPT).toContain('{{userName}}');
      expect(CRISIS_PROMPT).toContain('{{careRecipient}}');
    });

    it('renders with variables', () => {
      const result = renderPrompt(CRISIS_PROMPT, {
        userName: 'Alice',
        careRecipient: 'Dad',
      });
      expect(result).toContain('Alice');
      expect(result).toContain('Dad');
      expect(result).not.toContain('{{');
    });
  });

  describe('MAIN_PROMPT', () => {
    it('contains core instructions', () => {
      expect(MAIN_PROMPT).toContain('GiveCare Main Agent');
      expect(MAIN_PROMPT).toContain('SMS');
      expect(MAIN_PROMPT).toContain('caregiver');
    });

    it('contains trauma-informed principles', () => {
      expect(MAIN_PROMPT).toContain('P1');
      expect(MAIN_PROMPT).toContain('P2');
      expect(MAIN_PROMPT).toContain('skip');
    });

    it('contains tool references', () => {
      expect(MAIN_PROMPT).toContain('recordMemory');
      expect(MAIN_PROMPT).toContain('searchResources');
    });
  });

  describe('ASSESSMENT_PROMPT', () => {
    it('contains assessment instructions', () => {
      expect(ASSESSMENT_PROMPT).toContain('validated caregiver assessments');
      expect(ASSESSMENT_PROMPT).toContain('question');
    });

    it('contains progress tracking', () => {
      expect(ASSESSMENT_PROMPT).toContain('progress');
      expect(ASSESSMENT_PROMPT).toContain('skip');
    });

    it('contains pressure zones reference', () => {
      expect(ASSESSMENT_PROMPT).toContain('pressure zones');
      expect(ASSESSMENT_PROMPT).toContain('interventions');
    });
  });
});
