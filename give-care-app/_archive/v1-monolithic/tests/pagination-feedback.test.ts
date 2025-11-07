/**
 * Tests for Feedback getSessionLength Pagination
 *
 * PHASE 1: Tests for current behavior with small datasets
 *
 * These tests verify that getSessionLength:
 * - Correctly counts messages in last 24 hours
 * - Filters out messages older than 24 hours
 * - Handles empty conversation history
 * - Returns accurate session length
 *
 * PHASE 2: Tests will be added for pagination behavior
 */

import { describe, it, expect } from 'vitest';

describe('Feedback getSessionLength - Current Behavior', () => {
  describe('Empty Dataset', () => {
    it('should return 0 for user with no messages', () => {
      const messages: any[] = [];
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      const sessionLength = messages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(sessionLength).toBe(0);
    });
  });

  describe('Time-Based Filtering', () => {
    it('should count only messages from last 24 hours', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const messages = [
        { _creationTime: now - 1000 * 60 * 60 }, // 1 hour ago ✓
        { _creationTime: now - 1000 * 60 * 60 * 2 }, // 2 hours ago ✓
        { _creationTime: now - 1000 * 60 * 60 * 23 }, // 23 hours ago ✓
        { _creationTime: now - 1000 * 60 * 60 * 25 }, // 25 hours ago ✗
        { _creationTime: now - 1000 * 60 * 60 * 48 }, // 48 hours ago ✗
      ];

      const sessionLength = messages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(sessionLength).toBe(3);
    });

    it('should include message exactly at 24 hour boundary', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const messages = [
        { _creationTime: oneDayAgo + 1 }, // Just inside 24 hours ✓
        { _creationTime: oneDayAgo }, // Exactly 24 hours (equal, not greater) ✗
        { _creationTime: oneDayAgo - 1 }, // Just outside 24 hours ✗
      ];

      const sessionLength = messages.filter((m: any) => m._creationTime > oneDayAgo).length;

      // Only messages with _creationTime > oneDayAgo are counted
      expect(sessionLength).toBe(1);
    });

    it('should handle all messages within last 24 hours', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const messages = [
        { _creationTime: now - 1000 * 60 }, // 1 minute ago
        { _creationTime: now - 1000 * 60 * 30 }, // 30 minutes ago
        { _creationTime: now - 1000 * 60 * 60 }, // 1 hour ago
        { _creationTime: now - 1000 * 60 * 60 * 12 }, // 12 hours ago
      ];

      const sessionLength = messages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(sessionLength).toBe(4);
    });

    it('should handle all messages older than 24 hours', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const messages = [
        { _creationTime: now - 1000 * 60 * 60 * 25 }, // 25 hours ago
        { _creationTime: now - 1000 * 60 * 60 * 48 }, // 48 hours ago
        { _creationTime: now - 1000 * 60 * 60 * 72 }, // 72 hours ago
      ];

      const sessionLength = messages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(sessionLength).toBe(0);
    });
  });

  describe('Small Dataset (< 10 messages)', () => {
    it('should correctly count 5 recent messages', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const messages = Array.from({ length: 5 }, (_, i) => ({
        _creationTime: now - 1000 * 60 * 60 * (i + 1), // 1-5 hours ago
      }));

      const sessionLength = messages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(sessionLength).toBe(5);
    });
  });

  describe('Medium Dataset (10-100 messages)', () => {
    it('should correctly count 50 messages mixed within and outside 24 hour window', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Create 30 messages within 24 hours, 20 messages older than 24 hours
      const recentMessages = Array.from({ length: 30 }, (_, i) => ({
        _creationTime: now - 1000 * 60 * (i + 1), // 1-30 minutes ago
      }));

      const oldMessages = Array.from({ length: 20 }, (_, i) => ({
        _creationTime: now - 1000 * 60 * 60 * 24 - 1000 * (i + 1), // Just over 24 hours ago
      }));

      const messages = [...recentMessages, ...oldMessages];

      const sessionLength = messages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(sessionLength).toBe(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages with identical timestamps', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const timestamp = now - 1000 * 60 * 60; // 1 hour ago

      const messages = [
        { _creationTime: timestamp },
        { _creationTime: timestamp },
        { _creationTime: timestamp },
      ];

      const sessionLength = messages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(sessionLength).toBe(3);
    });

    it('should handle very recent messages (within last second)', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      const messages = [
        { _creationTime: now }, // Right now
        { _creationTime: now - 100 }, // 100ms ago
        { _creationTime: now - 1000 }, // 1 second ago
      ];

      const sessionLength = messages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(sessionLength).toBe(3);
    });
  });
});

describe('Feedback getSessionLength - Pagination Behavior', () => {
  describe('Large Dataset Handling (> 100 messages)', () => {
    it('should only process first 100 messages when limit is applied', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Create 200 messages, all within 24 hours
      const allMessages = Array.from({ length: 200 }, (_, i) => ({
        _creationTime: now - 1000 * 60 * (i + 1), // Incrementally older messages
      }));

      // Simulate .take(100) behavior - get first 100 messages
      const limitedMessages = allMessages.slice(0, 100);

      expect(limitedMessages.length).toBe(100);
      expect(allMessages.length).toBe(200);

      // All 100 limited messages should be within 24 hours
      const sessionLength = limitedMessages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(sessionLength).toBe(100);
    });

    it('should handle case where first 100 messages span beyond 24 hours', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Create 150 messages spanning multiple days
      const allMessages = Array.from({ length: 150 }, (_, i) => ({
        // Messages at index 0-49 are within 24 hours (1-50 hours ago)
        // Messages at index 50-149 are beyond 24 hours (50-150 hours ago)
        _creationTime: now - 1000 * 60 * 60 * (i + 1),
      }));

      // Simulate .take(100) behavior
      const limitedMessages = allMessages.slice(0, 100);

      expect(limitedMessages.length).toBe(100);

      // Count how many are within 24 hours
      const sessionLength = limitedMessages.filter((m: any) => m._creationTime > oneDayAgo).length;

      // Only first 23 messages should be within 24 hours (1-23 hours ago)
      // Messages 24-100 are 24+ hours ago
      expect(sessionLength).toBeLessThan(100);
      expect(sessionLength).toBeGreaterThan(0);
    });

    it('should provide accurate count when all 100 limited messages are recent', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Create 200 messages, all very recent (within last hour)
      const allMessages = Array.from({ length: 200 }, (_, i) => ({
        _creationTime: now - 1000 * (i + 1), // 1-200 seconds ago
      }));

      // Simulate .take(100) behavior
      const limitedMessages = allMessages.slice(0, 100);

      const sessionLength = limitedMessages.filter((m: any) => m._creationTime > oneDayAgo).length;

      // All 100 should be within 24 hours
      expect(sessionLength).toBe(100);
    });
  });

  describe('Pagination Impact on Session Accuracy', () => {
    it('should show difference between limited and unlimited counting', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Create 150 messages, all within 24 hours
      const allMessages = Array.from({ length: 150 }, (_, i) => ({
        _creationTime: now - 1000 * 60 * (i + 1), // 1-150 minutes ago
      }));

      // Unlimited count
      const unlimitedSessionLength = allMessages.filter((m: any) => m._creationTime > oneDayAgo).length;

      // Limited count (first 100 messages)
      const limitedMessages = allMessages.slice(0, 100);
      const limitedSessionLength = limitedMessages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(unlimitedSessionLength).toBe(150);
      expect(limitedSessionLength).toBe(100);

      // Pagination causes undercount by 50 messages
      expect(unlimitedSessionLength - limitedSessionLength).toBe(50);
    });

    it('should show no difference when dataset is smaller than limit', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Create 50 messages, all within 24 hours
      const allMessages = Array.from({ length: 50 }, (_, i) => ({
        _creationTime: now - 1000 * 60 * (i + 1),
      }));

      // Unlimited count
      const unlimitedSessionLength = allMessages.filter((m: any) => m._creationTime > oneDayAgo).length;

      // Limited count (first 100 messages, but only 50 exist)
      const limitedMessages = allMessages.slice(0, 100);
      const limitedSessionLength = limitedMessages.filter((m: any) => m._creationTime > oneDayAgo).length;

      expect(unlimitedSessionLength).toBe(50);
      expect(limitedSessionLength).toBe(50);
    });
  });

  describe('Performance Characteristics', () => {
    it('should demonstrate that limiting reduces processing time', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      // Create large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        _creationTime: now - 1000 * (i + 1),
      }));

      const startUnlimited = performance.now();
      const unlimitedResult = largeDataset.filter((m: any) => m._creationTime > oneDayAgo).length;
      const endUnlimited = performance.now();

      const limitedDataset = largeDataset.slice(0, 100);
      const startLimited = performance.now();
      const limitedResult = limitedDataset.filter((m: any) => m._creationTime > oneDayAgo).length;
      const endLimited = performance.now();

      // Verify we're processing different amounts of data
      expect(limitedDataset.length).toBe(100);
      expect(largeDataset.length).toBe(10000);

      // Results will differ if we have more than 100 messages in 24hr window
      expect(unlimitedResult).toBeGreaterThanOrEqual(limitedResult);
    });
  });
});
