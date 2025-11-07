/**
 * Tests for Email Sequences - Assessment Follow-ups
 *
 * Tests cover:
 * 1. Day 3 follow-up trigger logic
 * 2. Day 7 follow-up trigger logic
 * 3. Day 14 follow-up trigger logic
 * 4. Time window validation (2.5-3.5 days, etc.)
 * 5. Eligibility filtering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

const modules = import.meta.glob('../convex/**/*.ts');

describe('Email Sequences - Day 3 Follow-up', () => {
  it('should identify contacts eligible for Day 3 follow-up', async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

    // Create contact with assessment completed 3 days ago
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'day3@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: false,
      },
      assessmentData: {
        score: 18,
        band: 'Moderate',
        pressureZones: ['Emotional Burden'],
      },
    });

    // Manually update assessment date to 3 days ago
    const contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'day3@example.com',
    });

    await t.run(async (ctx) => {
      if (contact) {
        await ctx.db.patch(contact._id, {
          latestAssessmentDate: threeDaysAgo,
        });
      }
    });

    // Query for eligible contacts
    const eligible = await t.query(api.functions.emailContacts.getAssessmentFollowupSubscribers, {});

    const day3Eligible = eligible.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(now - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 2.5 && daysSince <= 3.5;
    });

    expect(day3Eligible.length).toBeGreaterThan(0);
    expect(day3Eligible[0].email).toBe('day3@example.com');
  });

  it('should NOT include contacts outside Day 3 window (2.5-3.5 days)', async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000; // Too soon

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'toosoon@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: false,
      },
      assessmentData: {
        score: 12,
        band: 'Mild',
        pressureZones: [],
      },
    });

    const contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'toosoon@example.com',
    });

    await t.run(async (ctx) => {
      if (contact) {
        await ctx.db.patch(contact._id, {
          latestAssessmentDate: twoDaysAgo,
        });
      }
    });

    const eligible = await t.query(api.functions.emailContacts.getAssessmentFollowupSubscribers, {});

    const day3Eligible = eligible.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(now - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 2.5 && daysSince <= 3.5;
    });

    expect(day3Eligible.every((c) => c.email !== 'toosoon@example.com')).toBe(true);
  });

  it('should NOT include contacts who opted out of assessment follow-ups', async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'optedout@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: false, // Opted out
        productUpdates: false,
      },
      assessmentData: {
        score: 20,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion'],
      },
    });

    const contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'optedout@example.com',
    });

    await t.run(async (ctx) => {
      if (contact) {
        await ctx.db.patch(contact._id, {
          latestAssessmentDate: threeDaysAgo,
        });
      }
    });

    const eligible = await t.query(api.functions.emailContacts.getAssessmentFollowupSubscribers, {});

    expect(eligible.every((c) => c.email !== 'optedout@example.com')).toBe(true);
  });
});

describe('Email Sequences - Day 7 Follow-up', () => {
  it('should identify contacts eligible for Day 7 follow-up', async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'day7@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: false,
      },
      assessmentData: {
        score: 22,
        band: 'Severe',
        pressureZones: ['Emotional Burden', 'Financial Concerns'],
      },
    });

    const contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'day7@example.com',
    });

    await t.run(async (ctx) => {
      if (contact) {
        await ctx.db.patch(contact._id, {
          latestAssessmentDate: sevenDaysAgo,
        });
      }
    });

    const eligible = await t.query(api.functions.emailContacts.getAssessmentFollowupSubscribers, {});

    const day7Eligible = eligible.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(now - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 6.5 && daysSince <= 7.5;
    });

    expect(day7Eligible.length).toBeGreaterThan(0);
    expect(day7Eligible[0].email).toBe('day7@example.com');
  });

  it('should NOT include contacts outside Day 7 window (6.5-7.5 days)', async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000; // Too soon

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'day7toosoon@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: false,
      },
      assessmentData: {
        score: 15,
        band: 'Moderate',
        pressureZones: ['Time Management'],
      },
    });

    const contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'day7toosoon@example.com',
    });

    await t.run(async (ctx) => {
      if (contact) {
        await ctx.db.patch(contact._id, {
          latestAssessmentDate: fiveDaysAgo,
        });
      }
    });

    const eligible = await t.query(api.functions.emailContacts.getAssessmentFollowupSubscribers, {});

    const day7Eligible = eligible.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(now - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 6.5 && daysSince <= 7.5;
    });

    expect(day7Eligible.every((c) => c.email !== 'day7toosoon@example.com')).toBe(true);
  });
});

describe('Email Sequences - Day 14 Follow-up', () => {
  it('should identify contacts eligible for Day 14 follow-up', async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'day14@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: false,
      },
      assessmentData: {
        score: 10,
        band: 'Mild',
        pressureZones: [],
      },
    });

    const contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'day14@example.com',
    });

    await t.run(async (ctx) => {
      if (contact) {
        await ctx.db.patch(contact._id, {
          latestAssessmentDate: fourteenDaysAgo,
        });
      }
    });

    const eligible = await t.query(api.functions.emailContacts.getAssessmentFollowupSubscribers, {});

    const day14Eligible = eligible.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(now - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 13.5 && daysSince <= 14.5;
    });

    expect(day14Eligible.length).toBeGreaterThan(0);
    expect(day14Eligible[0].email).toBe('day14@example.com');
  });

  it('should NOT include contacts outside Day 14 window (13.5-14.5 days)', async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const twentyDaysAgo = now - 20 * 24 * 60 * 60 * 1000; // Too late

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'day14toolate@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: false,
      },
      assessmentData: {
        score: 16,
        band: 'Moderate',
        pressureZones: ['Social Support'],
      },
    });

    const contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'day14toolate@example.com',
    });

    await t.run(async (ctx) => {
      if (contact) {
        await ctx.db.patch(contact._id, {
          latestAssessmentDate: twentyDaysAgo,
        });
      }
    });

    const eligible = await t.query(api.functions.emailContacts.getAssessmentFollowupSubscribers, {});

    const day14Eligible = eligible.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(now - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 13.5 && daysSince <= 14.5;
    });

    expect(day14Eligible.every((c) => c.email !== 'day14toolate@example.com')).toBe(true);
  });
});

describe('Email Sequences - Multiple Contacts', () => {
  it('should process multiple eligible contacts for same day', async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

    // Create multiple contacts eligible for Day 3
    const emails = ['contact1@example.com', 'contact2@example.com', 'contact3@example.com'];

    for (const email of emails) {
      await t.mutation(api.functions.emailContacts.upsert, {
        email,
        tags: ['assessment'],
        preferences: {
          newsletter: false,
          assessmentFollowup: true,
          productUpdates: false,
        },
        assessmentData: {
          score: 15,
          band: 'Moderate',
          pressureZones: ['Emotional Burden'],
        },
      });

      const contact = await t.query(api.functions.emailContacts.getByEmail, { email });
      await t.run(async (ctx) => {
        if (contact) {
          await ctx.db.patch(contact._id, {
            latestAssessmentDate: threeDaysAgo,
          });
        }
      });
    }

    const eligible = await t.query(api.functions.emailContacts.getAssessmentFollowupSubscribers, {});

    const day3Eligible = eligible.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(now - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 2.5 && daysSince <= 3.5;
    });

    expect(day3Eligible.length).toBe(3);
  });

  it('should handle contacts at different follow-up stages', async () => {
    const t = convexTest(schema, modules);

    const now = Date.now();

    // Day 3 contact
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'stage3@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: false,
      },
      assessmentData: {
        score: 12,
        band: 'Mild',
        pressureZones: [],
      },
    });

    let contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'stage3@example.com',
    });
    await t.run(async (ctx) => {
      if (contact) {
        await ctx.db.patch(contact._id, {
          latestAssessmentDate: now - 3 * 24 * 60 * 60 * 1000,
        });
      }
    });

    // Day 7 contact
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'stage7@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: false,
      },
      assessmentData: {
        score: 18,
        band: 'Moderate',
        pressureZones: ['Time Management'],
      },
    });

    contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'stage7@example.com',
    });
    await t.run(async (ctx) => {
      if (contact) {
        await ctx.db.patch(contact._id, {
          latestAssessmentDate: now - 7 * 24 * 60 * 60 * 1000,
        });
      }
    });

    const eligible = await t.query(api.functions.emailContacts.getAssessmentFollowupSubscribers, {});

    expect(eligible.length).toBeGreaterThanOrEqual(2);
  });
});
