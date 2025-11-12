/**
 * Resource Service
 * Convex-aware service for resource operations
 */

import { ActionCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { mapZoneToCategories } from "../domain/zoneMapping";
import { internal } from "../../_generated/api";

/**
 * Suggest resources for a pressure zone
 * Called by workflow after assessment completion
 */
export async function suggestResourcesForZone(
  ctx: ActionCtx,
  userId: Id<"users">,
  zone: string
): Promise<void> {
  // Get user to find zip code
  const user = await ctx.runQuery(internal.users.getUser, { userId });
  if (!user) {
    return;
  }

  const metadata = user.metadata || {};
  const zipCode = metadata.zipCode;

  if (!zipCode) {
    // Can't suggest resources without zip code
    return;
  }

  // Map zone to resource categories
  const categories = mapZoneToCategories(zone as any);

  // Use searchResources action to find resources
  // This will use the cache and return results
  for (const category of categories) {
    await ctx.runAction(internal.resources.searchResources, {
      userId,
      query: `${category} near ${zipCode}`,
      category,
    });
  }

  // TODO: Send SMS to user with resource suggestions
  // This would be done via the workflow or a separate action
}

