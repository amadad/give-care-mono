/**
 * Type-Safe Context Helpers
 *
 * Prevents context leakage by providing minimal capability interfaces.
 * Model helpers should accept DbReader/DbWriter instead of full contexts.
 *
 * WHY: Actions don't expose ctx.db and shouldn't write directly.
 * Mixing QueryCtx | MutationCtx | ActionCtx makes it easy to call DB code
 * from the wrong runtime.
 */

import type { QueryCtx, MutationCtx } from '../_generated/server'

/**
 * Read-only database access
 * Use in model helpers that only need to query data
 */
export type DbReader = QueryCtx['db']

/**
 * Read/write database access
 * Use in model helpers that need to insert/patch/delete
 */
export type DbWriter = MutationCtx['db']

/**
 * Scheduler capability for mutations
 * Use when model helpers need to schedule background jobs
 */
export type Scheduler = MutationCtx['scheduler']

/**
 * Extract db from QueryCtx or MutationCtx
 */
export function getDb(ctx: QueryCtx | MutationCtx): DbReader {
  return ctx.db
}

/**
 * Extract db from MutationCtx
 */
export function getDbWriter(ctx: MutationCtx): DbWriter {
  return ctx.db
}

/**
 * Extract scheduler from MutationCtx
 */
export function getScheduler(ctx: MutationCtx): Scheduler {
  return ctx.scheduler
}

/**
 * Helper type for auth context
 */
export type AuthContext = {
  auth: QueryCtx['auth'] | MutationCtx['auth']
}

/**
 * Extract auth from context
 */
export function getAuth(ctx: QueryCtx | MutationCtx): AuthContext['auth'] {
  return ctx.auth
}
