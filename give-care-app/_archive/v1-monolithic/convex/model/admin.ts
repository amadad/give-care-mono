import type { QueryCtx } from '../_generated/server'

export async function getSystemMetrics(ctx: QueryCtx) {
  const users = await ctx.db
    .query('users')
    .withIndex('by_created')
    .order('desc')
    .take(1000)

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const activeUsers = users.filter(u => (u as any).lastContactAt && (u as any).lastContactAt > sevenDaysAgo)
  const crisisUsers = users.filter(u => (u as any).burnoutScore && (u as any).burnoutScore >= 80)

  const usersWithScores = users.filter(u => (u as any).burnoutScore !== undefined)
  const avgBurnoutScore =
    usersWithScores.length > 0
      ? usersWithScores.reduce((sum, u) => sum + ((u as any).burnoutScore || 0), 0) / usersWithScores.length
      : 0

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const recentConvos = await ctx.db
    .query('conversations')
    .withIndex('by_timestamp', q => q.gte('timestamp', oneDayAgo))
    .take(2000)

  const latencies = recentConvos
    .filter(c => c.latency !== undefined)
    .map(c => c.latency!)
    .sort((a, b) => a - b)
  const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0

  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    crisisAlerts: crisisUsers.length,
    avgBurnoutScore: Math.round(avgBurnoutScore * 10) / 10,
    p95ResponseTime: Math.round(p95Latency),
    subscriptionBreakdown: {
      active: users.filter(
        u => (u as any).subscriptionStatus === 'active' || (u as any).subscriptionStatus === 'trialing'
      ).length,
      incomplete: users.filter(u => (u as any).subscriptionStatus === 'incomplete').length,
      pastDue: users.filter(
        u => (u as any).subscriptionStatus === 'past_due' || (u as any).subscriptionStatus === 'unpaid'
      ).length,
      canceled: users.filter(
        u => (u as any).subscriptionStatus === 'canceled' || (u as any).subscriptionStatus === 'incomplete_expired'
      ).length,
      none: users.filter(u => !(u as any).subscriptionStatus || (u as any).subscriptionStatus === 'none').length,
    },
  }
}

export async function getAllUsers(
  ctx: QueryCtx,
  args: {
    search?: string
    journeyPhase?: string
    burnoutBand?: string
    subscriptionStatus?: string
    limit: number
    cursor?: string | null
  }
) {
  const limit = Math.min(Math.max(args.limit, 1), 200)
  const results = args.journeyPhase
    ? await ctx.db
        .query('users')
        .withIndex('by_journey', q => q.eq('journeyPhase', args.journeyPhase!))
        .paginate({ numItems: limit * 2, cursor: args.cursor || null })
    : args.burnoutBand
      ? await ctx.db
          .query('users')
          .withIndex('by_burnout_band', q => q.eq('burnoutBand', args.burnoutBand!))
          .paginate({ numItems: limit * 2, cursor: args.cursor || null })
      : await ctx.db
          .query('users')
          .withIndex('by_created')
          .order('desc')
          .paginate({ numItems: limit * 2, cursor: args.cursor || null })

  let filtered = results.page as any[]
  if (args.burnoutBand && !args.journeyPhase) {
    // already filtered via index
  } else if (args.burnoutBand) {
    filtered = filtered.filter(u => u.burnoutBand === args.burnoutBand)
  }
  if (args.subscriptionStatus) {
    filtered = filtered.filter(u => u.subscriptionStatus === args.subscriptionStatus)
  }

  const searchTerm = args.search?.trim()
  if (searchTerm) {
    const s = searchTerm.toLowerCase()
    filtered = filtered.filter(u => {
      const nameMatches = u.firstName && (u.firstName as string).toLowerCase().includes(s)
      const phoneMatches = u.phoneNumber && (u.phoneNumber as string).includes(searchTerm)
      const recipientMatches =
        u.careRecipientName && (u.careRecipientName as string).toLowerCase().includes(s)
      return Boolean(nameMatches || phoneMatches || recipientMatches)
    })
  }

  const sliced = filtered.slice(0, limit)
  const mapUser = (u: any) => ({
    _id: u._id,
    firstName: u.firstName || 'Unknown',
    relationship: u.relationship,
    phoneNumber: u.phoneNumber,
    burnoutScore: u.burnoutScore,
    burnoutBand: u.burnoutBand,
    journeyPhase: u.journeyPhase || 'onboarding',
    subscriptionStatus: u.subscriptionStatus || 'none',
    lastContactAt: u.lastContactAt,
    createdAt: u.createdAt,
  })

  return {
    users: sliced.map(mapUser),
    continueCursor: results.continueCursor,
    isDone: results.isDone || sliced.length < limit,
  }
}

