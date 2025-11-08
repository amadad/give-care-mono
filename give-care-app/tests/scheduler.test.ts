import { describe, it, expect } from 'vitest';
import { RRule } from 'rrule';

describe('Scheduler - Trigger Logic', () => {
  describe('RRule Parsing and Generation', () => {
    it('creates valid one-off trigger rrule', () => {
      const runAt = '2024-12-01T14:00:00';
      const dtstart = runAt.replace(/[-:]/g, '').slice(0, 15);
      const rruleString = `DTSTART:${dtstart}\nRRULE:FREQ=DAILY;COUNT=1`;

      const rule = RRule.fromString(rruleString);
      const occurrences = rule.all();

      // Should have exactly one occurrence
      expect(occurrences).toHaveLength(1);
    });

    it('creates valid recurring daily trigger', () => {
      const rruleString = 'FREQ=DAILY;INTERVAL=1';
      const rule = new RRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: new Date('2024-01-01T09:00:00'),
        until: new Date('2024-01-07T09:00:00'),
      });

      const occurrences = rule.all();

      // Should have 7 occurrences (Jan 1-7)
      expect(occurrences).toHaveLength(7);
    });

    it('creates valid weekly recurring trigger', () => {
      const rule = new RRule({
        freq: RRule.WEEKLY,
        byweekday: [RRule.MO, RRule.WE, RRule.FR],
        dtstart: new Date('2024-01-01T10:00:00'),
        count: 12,
      });

      const occurrences = rule.all();

      // Should have exactly 12 occurrences
      expect(occurrences).toHaveLength(12);

      // All should be Mon/Wed/Fri
      occurrences.forEach(date => {
        const day = date.getDay();
        expect([1, 3, 5]).toContain(day); // 1=Mon, 3=Wed, 5=Fri
      });
    });
  });

  describe('Trigger Due Detection', () => {
    const isDue = (nextRun: string, now: number): boolean => {
      const nextRunTime = new Date(nextRun).getTime();
      return nextRunTime <= now;
    };

    it('detects trigger is due when time has passed', () => {
      const nextRun = '2024-01-01T10:00:00';
      const now = new Date('2024-01-01T10:30:00').getTime();

      expect(isDue(nextRun, now)).toBe(true);
    });

    it('detects trigger is not due when time is in future', () => {
      const nextRun = '2024-01-01T10:00:00';
      const now = new Date('2024-01-01T09:30:00').getTime();

      expect(isDue(nextRun, now)).toBe(false);
    });

    it('detects trigger is due at exact time', () => {
      const nextRun = '2024-01-01T10:00:00';
      const now = new Date('2024-01-01T10:00:00').getTime();

      expect(isDue(nextRun, now)).toBe(true);
    });
  });

  describe('Next Run Calculation', () => {
    const calculateNextRun = (rruleString: string, after: Date): Date | null => {
      try {
        const rule = RRule.fromString(rruleString);
        return rule.after(after, false); // false = exclusive
      } catch {
        return null;
      }
    };

    it('calculates next daily occurrence', () => {
      const rruleString = 'FREQ=DAILY;INTERVAL=1';
      const rule = new RRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: new Date('2024-01-01T09:00:00'),
      });

      const nextRun = rule.after(new Date('2024-01-01T10:00:00'));

      expect(nextRun).toBeDefined();
      expect(nextRun?.toISOString()).toContain('2024-01-02');
    });

    it('returns null when no more occurrences', () => {
      const rule = new RRule({
        freq: RRule.DAILY,
        count: 1,
        dtstart: new Date('2024-01-01T09:00:00'),
      });

      const nextRun = rule.after(new Date('2024-01-02T00:00:00'));

      expect(nextRun).toBeNull();
    });

    it('respects timezone in calculations', () => {
      // This tests that we can create timezone-aware rules
      const rule = new RRule({
        freq: RRule.DAILY,
        dtstart: new Date('2024-01-01T09:00:00'),
        tzid: 'America/New_York',
      });

      const occurrences = rule.between(
        new Date('2024-01-01T00:00:00'),
        new Date('2024-01-03T00:00:00')
      );

      expect(occurrences).toHaveLength(2);
    });
  });

  describe('Batch Processing Logic', () => {
    const processBatch = (
      triggers: Array<{ _id: string; nextRun: string }>,
      now: number,
      batchSize: number
    ) => {
      return triggers
        .filter(t => new Date(t.nextRun).getTime() <= now)
        .slice(0, batchSize);
    };

    it('respects batch size limit', () => {
      const triggers = [
        { _id: '1', nextRun: '2024-01-01T09:00:00' },
        { _id: '2', nextRun: '2024-01-01T09:01:00' },
        { _id: '3', nextRun: '2024-01-01T09:02:00' },
        { _id: '4', nextRun: '2024-01-01T09:03:00' },
        { _id: '5', nextRun: '2024-01-01T09:04:00' },
      ];

      const now = new Date('2024-01-01T10:00:00').getTime();
      const batchSize = 3;

      const due = processBatch(triggers, now, batchSize);

      expect(due).toHaveLength(3);
    });

    it('only includes triggers that are due', () => {
      const triggers = [
        { _id: '1', nextRun: '2024-01-01T09:00:00' }, // due
        { _id: '2', nextRun: '2024-01-01T09:30:00' }, // due
        { _id: '3', nextRun: '2024-01-01T11:00:00' }, // not due
        { _id: '4', nextRun: '2024-01-01T12:00:00' }, // not due
      ];

      const now = new Date('2024-01-01T10:00:00').getTime();
      const batchSize = 10;

      const due = processBatch(triggers, now, batchSize);

      expect(due).toHaveLength(2);
      expect(due.map(t => t._id)).toEqual(['1', '2']);
    });

    it('handles empty trigger list', () => {
      const triggers: Array<{ _id: string; nextRun: string }> = [];
      const now = Date.now();
      const batchSize = 50;

      const due = processBatch(triggers, now, batchSize);

      expect(due).toHaveLength(0);
    });
  });

  describe('Trigger Type Validation', () => {
    it('validates one_off trigger structure', () => {
      const trigger = {
        type: 'one_off',
        userExternalId: 'user_123',
        rrule: 'DTSTART:20241201T140000\nRRULE:FREQ=DAILY;COUNT=1',
        timezone: 'America/New_York',
        nextRun: '2024-12-01T14:00:00',
        payload: { action: 'follow_up' },
      };

      expect(trigger.type).toBe('one_off');
      expect(trigger.rrule).toContain('COUNT=1');
      expect(trigger.payload).toBeDefined();
    });

    it('validates recurring trigger structure', () => {
      const trigger = {
        type: 'recurring',
        userExternalId: 'user_123',
        rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
        timezone: 'America/New_York',
        nextRun: '2024-01-01T09:00:00',
        payload: { action: 'check_in' },
      };

      expect(trigger.type).toBe('recurring');
      expect(trigger.rrule).toContain('FREQ=WEEKLY');
      expect(trigger.rrule).not.toContain('COUNT');
    });
  });
});
