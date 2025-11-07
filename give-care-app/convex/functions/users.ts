import { query } from '../_generated/server';
import { v } from 'convex/values';
import * as Users from '../model/users';

export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return Users.getByExternalId(ctx, externalId);
  },
});
