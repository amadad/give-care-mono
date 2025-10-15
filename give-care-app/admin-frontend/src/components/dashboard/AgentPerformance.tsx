import { useQuery } from 'convex/react'
import { api } from "convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Activity, Zap, Clock } from 'lucide-react'

export function AgentPerformance() {
  const performance = useQuery(api["functions/analytics"].getAgentPerformance, { days: 7 })

  if (!performance) {
    return <Skeleton className="h-64" />
  }

  const getAgentIcon = (agent: string) => {
    if (agent === 'crisis') return <Zap className="h-5 w-5 text-orange-600" />
    if (agent === 'assessment') return <Activity className="h-5 w-5 text-blue-600" />
    return <Activity className="h-5 w-5 text-primary" />
  }

  const getAgentLabel = (agent: string) => {
    return agent.charAt(0).toUpperCase() + agent.slice(1) + ' Agent'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {performance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performance.map((agent) => (
              <Card key={agent.agent}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    {getAgentIcon(agent.agent)}
                    <span className="font-semibold">{getAgentLabel(agent.agent)}</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Calls</p>
                      <p className="text-2xl font-bold">{agent.calls.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Avg Latency</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xl font-bold">{agent.avgLatency}ms</p>
                      </div>
                      {agent.avgLatency < 1000 && (
                        <Badge variant="default" className="mt-1 text-xs">Excellent</Badge>
                      )}
                      {agent.avgLatency >= 1000 && agent.avgLatency < 2000 && (
                        <Badge variant="outline" className="mt-1 text-xs">Good</Badge>
                      )}
                      {agent.avgLatency >= 2000 && (
                        <Badge variant="destructive" className="mt-1 text-xs">Needs Review</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No agent performance data available</p>
          </div>
        )}

        {/* Performance Summary */}
        {performance.length > 0 && (
          <div className="mt-6 p-4 bg-accent rounded-lg">
            <p className="text-sm font-semibold mb-2">Performance Summary</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Total API Calls: {performance.reduce((sum, a) => sum + a.calls, 0).toLocaleString()}</li>
              <li>• Average Response Time: {Math.round(performance.reduce((sum, a) => sum + a.avgLatency, 0) / performance.length)}ms</li>
              <li>• Target: &lt;2000ms (p95)</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
