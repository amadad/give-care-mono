import type { Id } from "../_generated/dataModel";
import type { GenericDatabaseReader } from "convex/server";

/**
 * Fetch user or throw for clearer failures
 */
export async function requireUser(
  db: GenericDatabaseReader<any>,
  userId: Id<"users">
) {
  const user = await db.get(userId);
  if (!user) {
    throw new Error(`User not found: ${String(userId)}`);
  }
  return user;
}
