/**
 * Tests for Email Campaigns
 *
 * Tests cover:
 * 1. Weekly wellness summary campaign
 * 2. Manual campaign segmentation by band
 * 3. Manual campaign segmentation by tags
 * 4. Manual campaign segmentation by pressure zones
 * 5. Newsletter subscriber filtering
 */

import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

const modules = import.meta.glob('../convex/**/*.ts');

describe('Email Campaigns - Weekly Summary', () => {
  it('should get all newsletter subscribers', async () => {
    const t = convexTest(schema, modules);

    // Create newsletter subscribers
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'subscriber1@example.com',
      tags: ['newsletter'],
      preferences: {
        newsletter: true,
        assessmentFollowup: false,
        productUpdates: true,
      },
    });

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'subscriber2@example.com',
      tags: ['newsletter'],
      preferences: {
        newsletter: true,
        assessmentFollowup: false,
        productUpdates: false,
      },
    });

    const subscribers = await t.query(api.functions.emailContacts.getNewsletterSubscribers, {});

    expect(subscribers.length).toBeGreaterThanOrEqual(2);
    expect(subscribers.every((s) => s.preferences.newsletter === true)).toBe(true);
    expect(subscribers.every((s) => s.status === 'active')).toBe(true);
  });

  it('should NOT include unsubscribed contacts', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'unsubscribed@example.com',
      tags: ['newsletter'],
      preferences: {
        newsletter: true,
        assessmentFollowup: false,
        productUpdates: true,
      },
    });

    // Unsubscribe the contact
    await t.mutation(api.functions.emailContacts.unsubscribe, {
      email: 'unsubscribed@example.com',
      reason: 'Too frequent',
    });

    const subscribers = await t.query(api.functions.emailContacts.getNewsletterSubscribers, {});

    expect(subscribers.every((s) => s.email !== 'unsubscribed@example.com')).toBe(true);
  });

  it('should NOT include contacts who opted out of newsletter', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'optedout@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false, // Opted out
        assessmentFollowup: true,
        productUpdates: true,
      },
    });

    const subscribers = await t.query(api.functions.emailContacts.getNewsletterSubscribers, {});

    expect(subscribers.every((s) => s.email !== 'optedout@example.com')).toBe(true);
  });
});

describe('Email Campaigns - Manual Campaign Segmentation', () => {
  it('should segment contacts by assessment band (Severe)', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'severe1@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 25,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion', 'Emotional Burden'],
      },
    });

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'severe2@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 28,
        band: 'Severe',
        pressureZones: ['Financial Concerns'],
      },
    });

    const severeContacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Severe',
    });

    expect(severeContacts.length).toBeGreaterThanOrEqual(2);
    expect(severeContacts.every((c) => c.latestAssessmentBand === 'Severe')).toBe(true);
    expect(severeContacts.every((c) => c.status === 'active')).toBe(true);
  });

  it('should segment contacts by assessment band (Moderate)', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'moderate1@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 15,
        band: 'Moderate',
        pressureZones: ['Time Management'],
      },
    });

    const moderateContacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Moderate',
    });

    expect(moderateContacts.length).toBeGreaterThan(0);
    expect(moderateContacts.every((c) => c.latestAssessmentBand === 'Moderate')).toBe(true);
  });

  it('should segment contacts by assessment band (Mild)', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'mild1@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 8,
        band: 'Mild',
        pressureZones: [],
      },
    });

    const mildContacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Mild',
    });

    expect(mildContacts.length).toBeGreaterThan(0);
    expect(mildContacts.every((c) => c.latestAssessmentBand === 'Mild')).toBe(true);
  });

  it('should segment contacts by tags', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'tagged1@example.com',
      tags: ['assessment', 'high_priority'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
    });

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'tagged2@example.com',
      tags: ['assessment', 'high_priority', 'crisis'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
    });

    const taggedContacts = await t.query(api.functions.emailContacts.getByTags, {
      tags: ['assessment', 'high_priority'],
    });

    expect(taggedContacts.length).toBeGreaterThanOrEqual(2);
    expect(
      taggedContacts.every((c) => c.tags.includes('assessment') && c.tags.includes('high_priority'))
    ).toBe(true);
  });

  it('should filter contacts by multiple criteria (band + tags)', async () => {
    const t = convexTest(schema, modules);

    // Create Severe contact with crisis tag
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'crisis1@example.com',
      tags: ['assessment', 'crisis'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 29,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion', 'Emotional Burden', 'Financial Concerns'],
      },
    });

    // Create Moderate contact with crisis tag (should NOT match)
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'moderate-crisis@example.com',
      tags: ['assessment', 'crisis'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 16,
        band: 'Moderate',
        pressureZones: ['Emotional Burden'],
      },
    });

    // Query Severe contacts
    const severeContacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Severe',
    });

    // Filter by crisis tag
    const severeCrisisContacts = severeContacts.filter((c) => c.tags.includes('crisis'));

    expect(severeCrisisContacts.length).toBeGreaterThan(0);
    expect(severeCrisisContacts.every((c) => c.latestAssessmentBand === 'Severe')).toBe(true);
    expect(severeCrisisContacts.every((c) => c.tags.includes('crisis'))).toBe(true);
  });
});

describe('Email Campaigns - Pressure Zone Targeting', () => {
  it('should identify contacts with specific pressure zones', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'physical@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 22,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion', 'Time Management'],
      },
    });

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'financial@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 18,
        band: 'Moderate',
        pressureZones: ['Financial Concerns'],
      },
    });

    // Get all active contacts and filter by pressure zone
    const allContacts = await t.query(api.functions.emailContacts.listAll, {
      status: 'active',
      limit: 100,
    });

    const physicalExhaustionContacts = allContacts.filter(
      (c) => c.pressureZones && c.pressureZones.includes('Physical Exhaustion')
    );

    expect(physicalExhaustionContacts.length).toBeGreaterThan(0);
    expect(
      physicalExhaustionContacts.every((c) => c.pressureZones?.includes('Physical Exhaustion'))
    ).toBe(true);
  });

  it('should handle contacts with multiple pressure zones', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'multipressure@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 26,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion', 'Emotional Burden', 'Financial Concerns'],
      },
    });

    const contact = await t.query(api.functions.emailContacts.getByEmail, {
      email: 'multipressure@example.com',
    });

    expect(contact?.pressureZones).toBeDefined();
    expect(contact?.pressureZones?.length).toBe(3);
  });
});

describe('Email Campaigns - Contact Stats', () => {
  it('should calculate contact statistics', async () => {
    const t = convexTest(schema, modules);

    // Create varied contacts
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'stats1@example.com',
      tags: ['newsletter'],
      preferences: {
        newsletter: true,
        assessmentFollowup: false,
        productUpdates: true,
      },
    });

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'stats2@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 20,
        band: 'Severe',
        pressureZones: ['Emotional Burden'],
      },
    });

    const stats = await t.query(api.functions.emailContacts.getStats, {});

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.active).toBeGreaterThan(0);
    expect(stats.newsletterSubscribers).toBeGreaterThan(0);
    expect(stats.byBand).toBeDefined();
    expect(typeof stats.byBand.Severe).toBe('number');
  });
});
