/**
 * Authentication and authorization helpers for Convex functions
 *
 * This module provides reusable helpers for verifying user ownership
 * and preventing unauthorized access to user data.
 */

import type { QueryCtx, MutationCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

type AuthContext = {
  db: QueryCtx['db'] | MutationCtx['db']
  auth: QueryCtx['auth'] | MutationCtx['auth']
}

/**
 * Verifies that the authenticated user owns the requested userId.
 *
 * This prevents security issues where any authenticated user could access
 * another user's data by changing the userId parameter.
 *
 * For Convex Auth users: identity.subject matches user._id
 * For Clerk users (if schema extended): identity.subject matches user.clerkId
 *
 * @param ctx - Convex context with db and auth
 * @param userId - The userId being requested
 * @throws Error if user is not authenticated
 * @throws Error if user is not found
 * @throws Error if authenticated user does not own the requested userId
 *
 * @example
 * ```ts
 * export const getMyData = query({
 *   args: { userId: v.id('users') },
 *   handler: async (ctx, args) => {
 *     await verifyUserOwnership(ctx, args.userId)
 *     // Now safe to proceed - user is authorized
 *     return await ctx.db.query('data').filter(...)
 *   }
 * })
 * ```
 */
export async function verifyUserOwnership(
  ctx: AuthContext,
  userId: Id<'users'>
): Promise<void> {
  // Get authenticated user identity
  const identity = await ctx.auth.getUserIdentity()

  // Check if user is authenticated
  if (!identity || !identity.subject) {
    throw new Error('User not authenticated')
  }

  // Look up the requested user
  const user = await ctx.db.get(userId)

  // Check if user exists
  if (!user) {
    throw new Error('User not found')
  }

  // Verify ownership
  // For Convex Auth: user._id should match identity.subject (which is the userId)
  // For Clerk Auth (if extended): user.clerkId matches identity.subject
  const clerkId = (user as any).clerkId // Type assertion for optional Clerk integration
  const isOwner = user._id === identity.subject || (clerkId && clerkId === identity.subject)

  if (!isOwner) {
    throw new Error('Not authorized to access this user\'s data')
  }
}

/**
 * Require an authenticated user.
 * Throws if no identity is present.
 */
export async function requireAuth(ctx: AuthContext) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity || !identity.subject) {
    throw new Error('User not authenticated')
  }
  return identity
}

/**
 * Ensure the caller is an admin.
 *
 * Strategy:
 * - Read ADMIN_USER_IDS (comma-separated) from environment and allow if identity.subject matches.
 * - Additionally allow if the loaded user has an `role === "admin"` field (future-proofing).
 *
 * Note: Keep this fast and deterministic so it can be used in every admin handler.
 */
export async function ensureAdmin(ctx: AuthContext) {
  const identity = await requireAuth(ctx)

  // 1) Environment-configured superusers
  const raw = (process.env.ADMIN_USER_IDS || '').trim()
  const admins = raw.length > 0 ? new Set(raw.split(',').map(s => s.trim())) : new Set<string>()
  if (admins.has(identity.subject)) return

  // 2) Role-based fallback (optional)
  const user = await ctx.db.get(identity.subject as unknown as Id<'users'>)
  const role = (user as any)?.role
  if (role === 'admin') return

  throw new Error('Admin privileges required')
}
