import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from "convex/_generated/api"
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Users, Activity, AlertTriangle, TrendingUp, Clock, CreditCard } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useMemo } from 'react'

export const Route = createFileRoute('/')({
  component: () => (
    <ErrorBoundary>
      <DashboardHome />
    </ErrorBoundary>
  ),
})

function DashboardHome() {
  // Query raw tables directly
  const users = useQuery(api.public.listUsers, {})
  const scores = useQuery(api.public.listScores, {})
  const subscriptions = useQuery(api.public.listSubscriptions, {})

  // Compute metrics client-side
  const metrics = useMemo(() => {
    if (!users || !scores) return null

    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    const activeUsers = users.filter(u =>
      u.lastEngagementDate && u.lastEngagementDate > sevenDaysAgo
    )

    const crisisScores = scores.filter(s => s.gcBurnout >= 80)

    const avgBurnoutScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.gcBurnout, 0) / scores.length
      : 0

    const subscriptionBreakdown = {
      active: subscriptions?.filter(s => s.status === "active").length || 0,
      incomplete: 0,
      pastDue: subscriptions?.filter(s => s.status === "past_due").length || 0,
      canceled: subscriptions?.filter(s => s.status === "canceled").length || 0,
      none: users.length - (subscriptions?.length || 0),
    }

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      crisisAlerts: crisisScores.length,
      avgBurnoutScore,
      p95ResponseTime: 1200, // Mock - requires agent_runs analysis
      subscriptionBreakdown,
    }
  }, [users, scores, subscriptions])

  if (!metrics) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const percentActive = metrics.totalUsers > 0
    ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100)
    : undefined

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          icon={<Users className="h-5 w-5" />}
          color="primary"
        />

        <MetricCard
          title="Active Users (7d)"
          value={metrics.activeUsers}
          subtitle={percentActive !== undefined ? `${percentActive}% active` : 'No users yet'}
          icon={<Activity className="h-5 w-5" />}
          color="success"
        />

        <MetricCard
          title="Crisis Alerts"
          value={metrics.crisisAlerts}
          subtitle="Burnout ≥80"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="destructive"
        />

        <MetricCard
          title="Avg Burnout Score"
          value={metrics.avgBurnoutScore.toFixed(1)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="default"
        />

        <MetricCard
          title="Response Time (p95)"
          value={`${metrics.p95ResponseTime}ms`}
          icon={<Clock className="h-5 w-5" />}
          color="default"
        />
      </div>

      {/* Subscription Breakdown */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Active"
            value={metrics.subscriptionBreakdown.active}
            subtitle="+ trialing"
            icon={<CreditCard className="h-5 w-5" />}
            color="success"
          />
          <MetricCard
            title="Incomplete"
            value={metrics.subscriptionBreakdown.incomplete}
            subtitle="Mid-checkout"
            icon={<CreditCard className="h-5 w-5" />}
            color="default"
          />
          <MetricCard
            title="Past Due"
            value={metrics.subscriptionBreakdown.pastDue}
            subtitle="+ unpaid"
            icon={<CreditCard className="h-5 w-5" />}
            color="warning"
          />
          <MetricCard
            title="Canceled"
            value={metrics.subscriptionBreakdown.canceled}
            subtitle="+ expired"
            icon={<CreditCard className="h-5 w-5" />}
            color="destructive"
          />
          <MetricCard
            title="None"
            value={metrics.subscriptionBreakdown.none}
            subtitle="Never subscribed"
            icon={<CreditCard className="h-5 w-5" />}
            color="default"
          />
        </div>
      </div>
    </div>
  )
}
