/**
 * Cleanup Functions
 * Data retention and cache cleanup
 */

import { internalMutation } from "../_generated/server";

/**
 * Cleanup old messages (90-day retention)
 */
export const cleanupOldMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    // TODO: Delete messages older than 90 days
    // Agent Component manages messages, may need to use component APIs
  },
});

