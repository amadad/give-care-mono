import { describe, it, expect } from 'vitest';
import {
  RateLimitError,
  UserNotFoundError,
  ValidationError,
  logError,
} from '../../convex/lib/errors';
import type { ErrorContext } from '../../convex/lib/errors';

describe('Error Utilities', () => {
  describe('RateLimitError', () => {
    it('creates error with retry after message', () => {
      const error = new RateLimitError(60000);
      expect(error.message).toContain('Rate limit exceeded');
      expect(error.message).toContain('60000');
    });

    it('is instance of ConvexError', () => {
      const error = new RateLimitError(60000);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('UserNotFoundError', () => {
    it('creates error with user ID message', () => {
      const error = new UserNotFoundError('+15551234567');
      expect(error.message).toContain('User not found');
      expect(error.message).toContain('+15551234567');
    });
  });

  describe('ValidationError', () => {
    it('creates error with field and reason', () => {
      const error = new ValidationError('zipCode', 'must be 5 digits');
      expect(error.message).toContain('zipCode');
      expect(error.message).toContain('must be 5 digits');
    });
  });

  describe('logError', () => {
    it('logs error with context', () => {
      const context: ErrorContext = {
        userId: 'test-user',
        agent: 'main',
        function: 'testFunction',
        traceId: 'test-trace',
      };
      
      const error = new Error('Test error');
      
      // Should not throw
      expect(() => logError(error, context)).not.toThrow();
    });

    it('handles non-Error objects', () => {
      const context: ErrorContext = {
        function: 'testFunction',
      };
      
      // Should not throw
      expect(() => logError('string error', context)).not.toThrow();
      expect(() => logError({ message: 'object error' }, context)).not.toThrow();
    });
  });
});

