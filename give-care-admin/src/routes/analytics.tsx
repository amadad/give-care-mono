import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from "convex/_generated/api"
import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BurnoutChart } from '@/components/dashboard/BurnoutChart'
import { QualityMetrics } from '@/components/dashboard/QualityMetrics'
import { AgentPerformance } from '@/components/dashboard/AgentPerformance'
import { SummaryPerformance } from '@/components/dashboard/SummaryPerformance'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export const Route = createFileRoute('/analytics')({
  component: () => (
    <ErrorBoundary>
      <AnalyticsPage />
    </ErrorBoundary>
  ),
})

function AnalyticsPage() {
  // Query raw tables
  const users = useQuery(api.public.listUsers, {})
  const scores = useQuery(api.public.listScores, {})
  const assessments = useQuery(api.assessments.listAssessments, {})
  const events = useQuery(api.public.listEvents, {})

  // Compute burnout distribution
  const burnoutDist = useMemo(() => {
    if (!scores) return null
    const distribution = { very_low: 0, low: 0, moderate: 0, high: 0 }
    scores.forEach(score => {
      if (score.band in distribution) {
        distribution[score.band as keyof typeof distribution]++
      }
    })
    return [
      { range: "Very Low", count: distribution.very_low },
      { range: "Low", count: distribution.low },
      { range: "Moderate", count: distribution.moderate },
      { range: "High", count: distribution.high },
    ]
  }, [scores])

  // Compute user journey funnel
  const journeyFunnel = useMemo(() => {
    if (!users || !assessments || !events) return null
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    return [
      { phase: "registered", count: users.length },
      { phase: "completed assessment", count: new Set(assessments.map(a => a.userId)).size },
      { phase: "tried intervention", count: new Set(events.filter(e => e.type === "intervention.try").map(e => e.userId)).size },
      { phase: "successful intervention", count: new Set(events.filter(e => e.type === "intervention.success").map(e => e.userId)).size },
      { phase: "active (7d)", count: users.filter(u => u.lastEngagementDate && u.lastEngagementDate > sevenDaysAgo).length },
    ]
  }, [users, assessments, events])

  // Compute daily metrics (mock for now)
  const dailyMetrics = useMemo(() => {
    const days = 30
    const data: Array<{ date: string; sent: number; received: number }> = []
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      data.push({
        date: date.toISOString().split('T')[0],
        sent: 0,
        received: 0,
      })
    }
    return data.reverse()
  }, [])

  const maxDailyMessages = useMemo(() => {
    if (!dailyMetrics) return 0
    const dailyTotals = dailyMetrics.map((d) => d.sent + d.received)
    return dailyTotals.length > 0 ? Math.max(...dailyTotals) : 0
  }, [dailyMetrics])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics & Insights</h1>

      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="quality">Quality Evaluations ⭐</TabsTrigger>
          <TabsTrigger value="performance">Agent Performance</TabsTrigger>
        </TabsList>

        {/* Tab 1: Usage Analytics */}
        <TabsContent value="usage" className="space-y-6">
          {/* Burnout Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Burnout Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {burnoutDist ? (
                <BurnoutChart data={burnoutDist} />
              ) : (
                <Skeleton className="h-64" />
              )}
            </CardContent>
          </Card>

          {/* Journey Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>User Journey Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {journeyFunnel ? (
                <div className="space-y-2">
                  {journeyFunnel.map((stage) => {
                    const total = journeyFunnel.reduce((sum, s) => sum + s.count, 0)
                    const percentage = total > 0 ? (stage.count / total * 100).toFixed(1) : 0
                    return (
                      <div key={stage.phase} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium capitalize">{stage.phase}</div>
                        <div className="flex-1">
                          <div className="h-8 bg-accent rounded overflow-hidden">
                            <div
                              className="h-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold"
                              style={{ width: `${percentage}%` }}
                            >
                              {stage.count > 0 && `${stage.count} (${percentage}%)`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Skeleton className="h-64" />
              )}
            </CardContent>
          </Card>

          {/* SMS Volume Trends */}
          <Card>
            <CardHeader>
              <CardTitle>SMS Volume Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyMetrics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {dailyMetrics.reduce((sum, d) => sum + d.sent, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Messages Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {dailyMetrics.reduce((sum, d) => sum + d.received, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Messages Received</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {dailyMetrics.length > 0
                          ? Math.round(dailyMetrics.reduce((sum, d) => sum + d.sent, 0) / dailyMetrics.length)
                          : 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Daily Volume</p>
                    </div>
                  </div>
                  {/* Simple trend visualization */}
                  <div className="h-32 flex items-end gap-1">
                    {dailyMetrics.slice(-14).map((day, i) => {
                      const total = day.sent + day.received
                      const height = maxDailyMessages > 0 ? (total / maxDailyMessages) * 100 : 0
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-primary rounded-t"
                          style={{ height: `${height}%` }}
                          title={day.date}
                        />
                      )
                    })}
                  </div>
                </div>
              ) : (
                <Skeleton className="h-64" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Quality Evaluations */}
        <TabsContent value="quality" className="space-y-6">
          <QualityMetrics />
          <SummaryPerformance />
        </TabsContent>

        {/* Tab 3: Agent Performance */}
        <TabsContent value="performance" className="space-y-6">
          <AgentPerformance />
        </TabsContent>
      </Tabs>
    </div>
  )
}
