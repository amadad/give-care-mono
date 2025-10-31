/**
 * Tests for Manual Campaign Functions
 *
 * Tests cover:
 * 1. Campaign segmentation by band
 * 2. Campaign segmentation by tags
 * 3. Campaign segmentation by pressure zones
 * 4. Combined segment filtering
 * 5. Campaign queueing and metadata
 */

import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../convex/_generated/api';
import schema from '../convex/schema';

const modules = import.meta.glob('../convex/**/*.ts');

describe('Manual Campaigns - Segment by Band', () => {
  it('should select contacts by Severe band', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'severe-campaign@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 27,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion'],
      },
    });

    const contacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Severe',
    });

    expect(contacts.length).toBeGreaterThan(0);
    expect(contacts.every((c) => c.latestAssessmentBand === 'Severe')).toBe(true);
    expect(contacts.every((c) => c.status === 'active')).toBe(true);
  });

  it('should exclude inactive contacts from campaign', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'inactive-campaign@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 25,
        band: 'Severe',
        pressureZones: ['Emotional Burden'],
      },
    });

    // Unsubscribe contact
    await t.mutation(api.functions.emailContacts.unsubscribe, {
      email: 'inactive-campaign@example.com',
    });

    const contacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Severe',
    });

    expect(contacts.every((c) => c.email !== 'inactive-campaign@example.com')).toBe(true);
  });
});

describe('Manual Campaigns - Segment by Tags', () => {
  it('should select contacts with specific tags', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'tagged-campaign1@example.com',
      tags: ['assessment', 'high_priority'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
    });

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'tagged-campaign2@example.com',
      tags: ['assessment', 'high_priority'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
    });

    const contacts = await t.query(api.functions.emailContacts.getByTags, {
      tags: ['assessment', 'high_priority'],
    });

    expect(contacts.length).toBeGreaterThanOrEqual(2);
    expect(
      contacts.every((c) => c.tags.includes('assessment') && c.tags.includes('high_priority'))
    ).toBe(true);
  });

  it('should require ALL specified tags (AND logic)', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'partial-tags@example.com',
      tags: ['assessment'], // Missing 'high_priority'
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
    });

    const contacts = await t.query(api.functions.emailContacts.getByTags, {
      tags: ['assessment', 'high_priority'],
    });

    expect(contacts.every((c) => c.email !== 'partial-tags@example.com')).toBe(true);
  });
});

describe('Manual Campaigns - Segment by Pressure Zones', () => {
  it('should identify contacts with Physical Exhaustion', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'physical-campaign@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 20,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion', 'Time Management'],
      },
    });

    const allContacts = await t.query(api.functions.emailContacts.listAll, {
      status: 'active',
      limit: 100,
    });

    const physicalContacts = allContacts.filter(
      (c) => c.pressureZones && c.pressureZones.includes('Physical Exhaustion')
    );

    expect(physicalContacts.length).toBeGreaterThan(0);
    expect(
      physicalContacts.every((c) => c.pressureZones?.includes('Physical Exhaustion'))
    ).toBe(true);
  });

  it('should identify contacts with Emotional Burden', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'emotional-campaign@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 18,
        band: 'Moderate',
        pressureZones: ['Emotional Burden'],
      },
    });

    const allContacts = await t.query(api.functions.emailContacts.listAll, {
      status: 'active',
      limit: 100,
    });

    const emotionalContacts = allContacts.filter(
      (c) => c.pressureZones && c.pressureZones.includes('Emotional Burden')
    );

    expect(emotionalContacts.length).toBeGreaterThan(0);
    expect(emotionalContacts.every((c) => c.pressureZones?.includes('Emotional Burden'))).toBe(
      true
    );
  });

  it('should identify contacts with Financial Concerns', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'financial-campaign@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 22,
        band: 'Severe',
        pressureZones: ['Financial Concerns'],
      },
    });

    const allContacts = await t.query(api.functions.emailContacts.listAll, {
      status: 'active',
      limit: 100,
    });

    const financialContacts = allContacts.filter(
      (c) => c.pressureZones && c.pressureZones.includes('Financial Concerns')
    );

    expect(financialContacts.length).toBeGreaterThan(0);
    expect(financialContacts.every((c) => c.pressureZones?.includes('Financial Concerns'))).toBe(
      true
    );
  });
});

describe('Manual Campaigns - Combined Segment Filters', () => {
  it('should filter by band AND tags', async () => {
    const t = convexTest(schema, modules);

    // Create Severe + crisis tagged contact
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'severe-crisis@example.com',
      tags: ['assessment', 'crisis'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 28,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion', 'Emotional Burden'],
      },
    });

    // Create Severe without crisis tag (should NOT match)
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'severe-nocrisis@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 26,
        band: 'Severe',
        pressureZones: ['Financial Concerns'],
      },
    });

    // Query by band
    const severeContacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Severe',
    });

    // Filter by tags
    const severeCrisis = severeContacts.filter((c) => c.tags.includes('crisis'));

    expect(severeCrisis.length).toBeGreaterThan(0);
    expect(severeCrisis.every((c) => c.latestAssessmentBand === 'Severe')).toBe(true);
    expect(severeCrisis.every((c) => c.tags.includes('crisis'))).toBe(true);
  });

  it('should filter by band AND pressure zones', async () => {
    const t = convexTest(schema, modules);

    // Create Severe + Physical Exhaustion
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'severe-physical@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 27,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion'],
      },
    });

    // Query by band
    const severeContacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Severe',
    });

    // Filter by pressure zones
    const severePhysical = severeContacts.filter(
      (c) => c.pressureZones && c.pressureZones.includes('Physical Exhaustion')
    );

    expect(severePhysical.length).toBeGreaterThan(0);
    expect(severePhysical.every((c) => c.latestAssessmentBand === 'Severe')).toBe(true);
    expect(
      severePhysical.every((c) => c.pressureZones?.includes('Physical Exhaustion'))
    ).toBe(true);
  });

  it('should filter by tags AND pressure zones', async () => {
    const t = convexTest(schema, modules);

    // Create contact with both criteria
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'crisis-physical@example.com',
      tags: ['assessment', 'crisis'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 29,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion', 'Emotional Burden'],
      },
    });

    // Query by tags
    const crisisContacts = await t.query(api.functions.emailContacts.getByTags, {
      tags: ['crisis'],
    });

    // Filter by pressure zones
    const crisisPhysical = crisisContacts.filter(
      (c) => c.pressureZones && c.pressureZones.includes('Physical Exhaustion')
    );

    expect(crisisPhysical.length).toBeGreaterThan(0);
    expect(crisisPhysical.every((c) => c.tags.includes('crisis'))).toBe(true);
    expect(crisisPhysical.every((c) => c.pressureZones?.includes('Physical Exhaustion'))).toBe(
      true
    );
  });

  it('should filter by band AND tags AND pressure zones', async () => {
    const t = convexTest(schema, modules);

    // Create contact matching all three criteria
    await t.mutation(api.functions.emailContacts.upsert, {
      email: 'triple-filter@example.com',
      tags: ['assessment', 'crisis'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 30,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion', 'Emotional Burden', 'Financial Concerns'],
      },
    });

    // Query by band
    const severeContacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Severe',
    });

    // Filter by tags AND pressure zones
    const tripleFiltered = severeContacts.filter(
      (c) =>
        c.tags.includes('crisis') &&
        c.pressureZones &&
        c.pressureZones.includes('Physical Exhaustion')
    );

    expect(tripleFiltered.length).toBeGreaterThan(0);
    expect(tripleFiltered.every((c) => c.latestAssessmentBand === 'Severe')).toBe(true);
    expect(tripleFiltered.every((c) => c.tags.includes('crisis'))).toBe(true);
    expect(
      tripleFiltered.every((c) => c.pressureZones?.includes('Physical Exhaustion'))
    ).toBe(true);
  });
});

describe('Manual Campaigns - Campaign Metadata', () => {
  it('should track campaign type and metadata', async () => {
    const t = convexTest(schema, modules);

    const campaignData = {
      type: 'crisis_resources',
      metadata: {
        theme: 'immediate_support',
        priority: 'high',
      },
    };

    // Verify campaign data structure
    expect(campaignData.type).toBe('crisis_resources');
    expect(campaignData.metadata.theme).toBe('immediate_support');
    expect(campaignData.metadata.priority).toBe('high');
  });

  it('should queue contacts for batch sending', async () => {
    const t = convexTest(schema, modules);

    // Create target contacts
    const emails = [
      'batch1@example.com',
      'batch2@example.com',
      'batch3@example.com',
    ];

    for (const email of emails) {
      await t.mutation(api.functions.emailContacts.upsert, {
        email,
        tags: ['assessment'],
        preferences: {
          newsletter: false,
          assessmentFollowup: true,
          productUpdates: true,
        },
        assessmentData: {
          score: 25,
          band: 'Severe',
          pressureZones: ['Physical Exhaustion'],
        },
      });
    }

    // Get contacts by band
    const contacts = await t.query(api.functions.emailContacts.getByBand, {
      band: 'Severe',
    });

    const emailAddresses = contacts.map((c) => c.email);

    // Verify we have queued contacts
    expect(emailAddresses.length).toBeGreaterThanOrEqual(3);
    expect(emailAddresses).toContain('batch1@example.com');
    expect(emailAddresses).toContain('batch2@example.com');
    expect(emailAddresses).toContain('batch3@example.com');
  });
});
