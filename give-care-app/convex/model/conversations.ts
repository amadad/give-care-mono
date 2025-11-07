import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

type InsertArgs = {
  userId: Id<'users'>
  role: string
  text: string
  mode: string
  messageSid?: string
  sessionId?: string
  agentName?: string
  toolCalls?: Array<{ name: string; args: unknown }>
  latency?: number
  serviceTier?: string
  tokenUsage?: { input: number; output: number; total: number }
  timestamp: number
}

export async function insert(ctx: MutationCtx, args: InsertArgs) {
  await ctx.db.insert('conversations', args)
}

export async function insertBatch(ctx: MutationCtx, messages: InsertArgs[]) {
  // Keep single-transaction semantics; parallel insert is OK in Convex mutations
  await Promise.all(messages.map(m => ctx.db.insert('conversations', m)))
}

export async function recent(
  ctx: QueryCtx,
  userId: Id<'users'>,
  limit = 50
) {
  return await ctx.db
    .query('conversations')
    .withIndex('by_user_time', q => q.eq('userId', userId))
    .order('desc')
    .take(limit)
}

