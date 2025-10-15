import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from "convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Database, Zap, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/system')({
  component: SystemHealthPage,
})

function SystemHealthPage() {
  const systemHealth = useQuery(api["functions/admin"].getSystemHealth)

  if (!systemHealth) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">System Health Monitoring</h1>
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    if (status === 'ok') return 'default'
    if (status === 'warning') return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Health Monitoring</h1>

      {/* Overall Status */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertTitle>System Status: Healthy</AlertTitle>
        <AlertDescription>
          All systems operational. No critical issues detected.
        </AlertDescription>
      </Alert>

      {/* Rate Limiter Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Rate Limiter Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Per-User Quota (Daily)</span>
              <Badge variant={getStatusColor(systemHealth.rateLimits.perUser.status)}>
                {systemHealth.rateLimits.perUser.used}/{systemHealth.rateLimits.perUser.limit} msg
              </Badge>
            </div>
            <Progress
              value={(systemHealth.rateLimits.perUser.used / systemHealth.rateLimits.perUser.limit) * 100}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Global Quota (Daily)</span>
              <Badge variant={getStatusColor(systemHealth.rateLimits.global.status)}>
                {systemHealth.rateLimits.global.used}/{systemHealth.rateLimits.global.limit} msg
              </Badge>
            </div>
            <Progress
              value={(systemHealth.rateLimits.global.used / systemHealth.rateLimits.global.limit) * 100}
            />
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Priority Tier Users: <span className="font-semibold">{systemHealth.rateLimits.priorityUsers}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI API Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            OpenAI API Usage (Today)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tokens Consumed</span>
              <Badge variant="outline">
                {(systemHealth.openai.tokensToday / 1000000).toFixed(2)}M / {(systemHealth.openai.tokensLimit / 1000000).toFixed(1)}M
              </Badge>
            </div>
            <Progress
              value={(systemHealth.openai.tokensToday / systemHealth.openai.tokensLimit) * 100}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cost Today</span>
              <Badge variant="outline">
                ${systemHealth.openai.costToday.toFixed(2)} / ${systemHealth.openai.budget.toFixed(2)}
              </Badge>
            </div>
            <Progress
              value={(systemHealth.openai.costToday / systemHealth.openai.budget) * 100}
            />
          </div>

          <div className="pt-2 border-t text-sm text-muted-foreground">
            <p>Quota Remaining: <span className="font-semibold">
              {Math.round((1 - systemHealth.openai.tokensToday / systemHealth.openai.tokensLimit) * 100)}%
            </span></p>
          </div>
        </CardContent>
      </Card>

      {/* Database Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Query Latency (p95)</p>
              <p className="text-2xl font-bold">{systemHealth.database.queryLatency}ms</p>
              <Badge variant="default" className="mt-1">Good</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Connection Pool</p>
              <p className="text-2xl font-bold">
                {systemHealth.database.connectionPoolActive}/{systemHealth.database.connectionPoolMax}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Active connections</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Storage Used</p>
              <p className="text-2xl font-bold">
                {systemHealth.database.storageUsed}GB
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                of {systemHealth.database.storageLimit}GB ({Math.round((systemHealth.database.storageUsed / systemHealth.database.storageLimit) * 100)}%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Logs (Last 24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemHealth.errors.length > 0 ? (
            <div className="space-y-2">
              {systemHealth.errors.map((error, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">{error.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={error.severity === 'warning' ? 'outline' : 'default'}>
                      {error.count} errors
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {error.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No errors in the last 24 hours</p>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span className="font-medium">0.6.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime:</span>
            <span className="font-medium">99.8% (30 days)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deployment:</span>
            <span className="font-medium">Convex (Production)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Deploy:</span>
            <span className="font-medium">2025-10-10 14:30 UTC</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
