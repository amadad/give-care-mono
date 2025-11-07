import type { QueryCtx, MutationCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'
import { internal } from '../_generated/api'

export async function latestScore(ctx: QueryCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('wellnessScores')
    .withIndex('by_user_recorded', (q: any) => q.eq('userId', userId))
    .order('desc')
    .first()
}

export async function scoreHistory(ctx: QueryCtx, userId: Id<'users'>, limit = 30) {
  return await ctx.db
    .query('wellnessScores')
    .withIndex('by_user_recorded', (q: any) => q.eq('userId', userId))
    .order('desc')
    .take(limit)
}

export async function trend(ctx: QueryCtx, userId: Id<'users'>, windowDays: number) {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const points = await ctx.db
    .query('wellnessScores')
    .withIndex('by_user_recorded', (q: any) => q.eq('userId', userId))
    .filter(q => q.gte(q.field('recordedAt'), cutoff))
    .collect()
  if (!points.length) return { count: 0, average: null, trend: [] }
  const average = points.reduce((sum, p) => sum + p.overallScore, 0) / points.length
  const trend = points.map(p => ({ score: p.overallScore, band: p.band, timestamp: p.recordedAt }))
  return { count: points.length, average: Math.round(average * 10) / 10, trend }
}

export async function pressureZoneTrends(ctx: QueryCtx, userId: Id<'users'>, windowDays: number) {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const scores = await ctx.db
    .query('wellnessScores')
    .withIndex('by_user_recorded', (q: any) => q.eq('userId', userId))
    .filter(q => q.gte(q.field('recordedAt'), cutoff))
    .collect()
  if (!scores.length) return {}
  const zoneAggregates: Record<string, { sum: number; count: number }> = {}
  for (const score of scores) {
    for (const zone of score.pressureZones) {
      if (!zoneAggregates[zone]) zoneAggregates[zone] = { sum: 0, count: 0 }
      const zoneScore = (score.pressureZoneScores as Record<string, number>)?.[zone] || 0
      zoneAggregates[zone].sum += zoneScore
      zoneAggregates[zone].count += 1
    }
  }
  const zoneTrends: Record<string, number> = {}
  for (const [zone, data] of Object.entries(zoneAggregates)) {
    zoneTrends[zone] = Math.round((data.sum / data.count) * 10) / 10
  }
  return zoneTrends
}

export async function saveScore(
  ctx: MutationCtx,
  args: {
    userId: Id<'users'>
    overallScore: number
    confidence?: number
    band?: string
    pressureZones: string[]
    pressureZoneScores: any
    assessmentSource?: string
    assessmentType?: string
    assessmentSessionId?: Id<'assessmentSessions'>
  }
) {
  const scoreId = await ctx.db.insert('wellnessScores', {
    ...args,
    recordedAt: Date.now(),
  })

  await ctx.db.patch(args.userId, {
    burnoutScore: args.overallScore,
    burnoutBand: args.band,
    burnoutConfidence: args.confidence,
    pressureZones: args.pressureZones,
    pressureZoneScores: args.pressureZoneScores,
    updatedAt: Date.now(),
  })

  const user = await ctx.db.get(args.userId)
  if (user && (user as any).journeyPhase === 'active') {
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    const firstName = (user as any).firstName || 'friend'
    await ctx.scheduler.runAfter(sevenDays, internal.functions.scheduling.sendScheduledMessage, {
      userId: args.userId,
      message: `Hi ${firstName}, ready for a quick check-in? It's been a week since your last assessment. (Reply YES when ready)`,
      type: 'assessment_reminder',
    })
  }

  return scoreId
}

