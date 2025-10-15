/**
 * Tests for Code Review Fixes (Phase 2: SDK Best Practices)
 *
 * These tests verify fixes for MEDIUM priority issues:
 * 1. Use hasContextState() type guard instead of unsafe casting
 * 2. Make recordFieldAttempt() a pure function (no mutation)
 *
 * NOTE: Agent.create() vs new Agent() - skipping this as the SDK doesn't
 * provide a static create() method in v0.1.9. The constructor approach
 * is the correct pattern for this SDK version.
 */

import { describe, it, expect } from 'vitest';
import { hasContextState } from '../src/types/openai-extensions';
import { contextHelpers, createGiveCareContext } from '../src/context';

describe('Code Review Fixes - Phase 2', () => {
  describe('1. hasContextState() type guard', () => {
    /**
     * Test: hasContextState should identify valid context results
     * This is the type-safe alternative to (result as any as RunResultWithContext)
     */
    it('should return true for result with state.context', () => {
      const mockResult = {
        finalOutput: 'Hello',
        state: {
          context: { userId: '123', phoneNumber: '+1234567890' }
        }
      };

      expect(hasContextState(mockResult)).toBe(true);
    });

    it('should return false for result without state', () => {
      const mockResult = {
        finalOutput: 'Hello'
      };

      expect(hasContextState(mockResult)).toBe(false);
    });

    it('should return false for null', () => {
      expect(hasContextState(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasContextState(undefined)).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(hasContextState('string')).toBe(false);
      expect(hasContextState(123)).toBe(false);
      expect(hasContextState(true)).toBe(false);
    });
  });

  describe('2. Pure recordFieldAttempt function', () => {
    /**
     * Test: recordFieldAttempt should return new context instead of mutating
     * This follows functional programming best practices
     */
    it('should return new context with incremented attempt count', () => {
      const originalContext = createGiveCareContext('user-123', '+1234567890', {
        onboardingAttempts: { firstName: 0 }
      });

      const newContext = contextHelpers.recordFieldAttempt(originalContext, 'firstName');

      // New context should have incremented count
      expect(newContext.onboardingAttempts.firstName).toBe(1);

      // Original context should be UNCHANGED (immutability)
      expect(originalContext.onboardingAttempts.firstName).toBe(0);
    });

    it('should initialize field attempt to 1 if not present', () => {
      const originalContext = createGiveCareContext('user-123', '+1234567890', {
        onboardingAttempts: {}
      });

      const newContext = contextHelpers.recordFieldAttempt(originalContext, 'lastName');

      expect(newContext.onboardingAttempts.lastName).toBe(1);
      expect(originalContext.onboardingAttempts.lastName).toBeUndefined();
    });

    it('should increment existing attempt count', () => {
      const originalContext = createGiveCareContext('user-123', '+1234567890', {
        onboardingAttempts: { firstName: 1 }
      });

      const newContext = contextHelpers.recordFieldAttempt(originalContext, 'firstName');

      expect(newContext.onboardingAttempts.firstName).toBe(2);
      expect(originalContext.onboardingAttempts.firstName).toBe(1);
    });

    it('should not affect other fields in context', () => {
      const originalContext = createGiveCareContext('user-123', '+1234567890', {
        firstName: 'John',
        onboardingAttempts: { firstName: 0 }
      });

      const newContext = contextHelpers.recordFieldAttempt(originalContext, 'firstName');

      // Other fields unchanged
      expect(newContext.firstName).toBe('John');
      expect(newContext.userId).toBe('user-123');
      expect(newContext.phoneNumber).toBe('+1234567890');
    });
  });
});
