import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

export async function patch(
  ctx: MutationCtx,
  userId: Id<'users'>,
  updates: Record<string, unknown>
) {
  await ctx.db.patch(userId, { ...updates, updatedAt: Date.now() })
}

export async function updateLastContact(
  ctx: MutationCtx,
  userId: Id<'users'>
) {
  await ctx.db.patch(userId, { lastContactAt: Date.now(), updatedAt: Date.now() })
}

export async function getByPhone(ctx: QueryCtx, phoneNumber: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_phone', q => q.eq('phoneNumber', phoneNumber))
    .first()
}

