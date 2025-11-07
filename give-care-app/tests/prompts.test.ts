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
      expect(MAIN_PROMPT).toContain('caregiver assistant');
      expect(MAIN_PROMPT).toContain('support');
    });

    it('has required placeholders', () => {
      expect(MAIN_PROMPT).toContain('{{userName}}');
      expect(MAIN_PROMPT).toContain('{{careRecipient}}');
      expect(MAIN_PROMPT).toContain('{{journeyPhase}}');
      expect(MAIN_PROMPT).toContain('{{totalInteractionCount}}');
    });

    it('renders with all variables', () => {
      const result = renderPrompt(MAIN_PROMPT, {
        userName: 'Bob',
        careRecipient: 'Mom',
        journeyPhase: 'active',
        totalInteractionCount: 10,
      });
      expect(result).toContain('Bob');
      expect(result).toContain('Mom');
      expect(result).toContain('active');
      expect(result).toContain('10');
      expect(result).not.toContain('{{');
    });
  });

  describe('ASSESSMENT_PROMPT', () => {
    it('contains assessment instructions', () => {
      expect(ASSESSMENT_PROMPT).toContain('burnout assessment');
      expect(ASSESSMENT_PROMPT).toContain('score');
    });

    it('has assessment-specific placeholders', () => {
      expect(ASSESSMENT_PROMPT).toContain('{{totalScore}}');
      expect(ASSESSMENT_PROMPT).toContain('{{avgScore}}');
      expect(ASSESSMENT_PROMPT).toContain('{{band}}');
      expect(ASSESSMENT_PROMPT).toContain('{{pressureZones}}');
    });

    it('renders with assessment variables', () => {
      const result = renderPrompt(ASSESSMENT_PROMPT, {
        userName: 'Carol',
        careRecipient: 'Brother',
        totalScore: 45,
        avgScore: 3.5,
        band: 'moderate',
        pressureZones: 'emotional, physical',
      });
      expect(result).toContain('Carol');
      expect(result).toContain('Brother');
      expect(result).toContain('45');
      expect(result).toContain('3.5');
      expect(result).toContain('moderate');
      expect(result).toContain('emotional');
      expect(result).not.toContain('{{');
    });
  });
});
