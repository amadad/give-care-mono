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

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const burnoutDist = useQuery(api["functions/analytics"].getBurnoutDistribution)
  const journeyFunnel = useQuery(api["functions/analytics"].getUserJourneyFunnel)
  const dailyMetrics = useQuery(api["functions/analytics"].getDailyMetrics, { days: 30 })

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
        </TabsContent>

        {/* Tab 3: Agent Performance */}
        <TabsContent value="performance" className="space-y-6">
          <AgentPerformance />
        </TabsContent>
      </Tabs>
    </div>
  )
}
