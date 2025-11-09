/**
 * User lookup helpers.
 */

import { query } from '../_generated/server';
import { v } from 'convex/values';
import * as Core from '../core';

export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return Core.getByExternalId(ctx, externalId);
  },
});
