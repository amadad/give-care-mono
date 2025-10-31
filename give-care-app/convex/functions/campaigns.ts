import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';

/**
 * Send manual campaign to segment
 */
export const sendCampaign = mutation({
  args: {
    segment: v.object({
      band: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      pressureZones: v.optional(v.array(v.string())),
    }),
    campaignData: v.object({
      type: v.string(),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { segment, campaignData }) => {
    // Get contacts based on segment
    let contacts = await ctx.db.query('emailContacts')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();

    // Filter by band
    if (segment.band) {
      contacts = contacts.filter(c => c.latestAssessmentBand === segment.band);
    }

    // Filter by tags
    if (segment.tags && segment.tags.length > 0) {
      contacts = contacts.filter(c =>
        segment.tags!.some(tag => c.tags.includes(tag))
      );
    }

    // Filter by pressure zones
    if (segment.pressureZones && segment.pressureZones.length > 0) {
      contacts = contacts.filter(c =>
        c.pressureZones && segment.pressureZones!.some(zone =>
          c.pressureZones!.includes(zone)
        )
      );
    }

    const emailAddresses = contacts.map(c => c.email);

    // Trigger batch send via action
    // Note: Must call this separately since mutations can't call actions directly
    console.log(`Campaign queued for ${emailAddresses.length} contacts`);

    return {
      queuedCount: emailAddresses.length,
      contacts: emailAddresses,
      campaignData,
    };
  },
});
