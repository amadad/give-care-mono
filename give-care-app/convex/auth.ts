import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { ADMIN_EMAILS } from "./lib/adminConfig";

/**
 * Post-auth hook to ensure required fields are set for admin users
 * Called after user creation/update by Convex Auth
 */
export const ensureAdminUserFields = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;

    const updates: any = {};

    // Set channel if missing (admin users are web-based)
    if (!user.channel) {
      updates.channel = "web";
    }

    // Set locale if missing
    if (!user.locale) {
      updates.locale = "en-US";
    }

    // Check email whitelist
    if (user.email && !ADMIN_EMAILS.includes(user.email)) {
      throw new Error("Unauthorized: Admin access only. Contact administrator to request access.");
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
