import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Play } from 'lucide-react'
import { useState } from 'react'
import { StatsCards } from '@/components/etl/StatsCards'
import { WorkflowCard } from '@/components/etl/WorkflowCard'
import { QAQueue } from '@/components/etl/QAQueue'
import { Skeleton } from '@/components/ui/skeleton'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export const Route = createFileRoute('/etl')({
  component: () => (
    <ErrorBoundary>
      <ETLDashboard />
    </ErrorBoundary>
  ),
})

function ETLDashboard() {
  const stats = useQuery(api.etl.getDashboardStats)
  const workflows = useQuery(api.etl.listWorkflows, { limit: 10 })
  const qaQueue = useQuery(api.etl.getQAQueue, { limit: 20 })
  const [isTriggering, setIsTriggering] = useState(false)

  const handleTriggerWorkflow = async () => {
    setIsTriggering(true)
    try {
      // Use localhost for development, production URL otherwise
      const isDevelopment = window.location.hostname === 'localhost'
      const etlUrl = isDevelopment
        ? 'http://localhost:8787/orchestrate'
        : 'https://give-care-etl.ali-a90.workers.dev/orchestrate'

      console.log('Triggering workflow at:', etlUrl)

      // Call ETL worker endpoint
      const response = await fetch(etlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'discover_caregiver_resources',
          state: 'NY',
          limit: 5
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('Workflow triggered:', data)
      alert(`Workflow started!\n\nSession ID: ${data.sessionId}\n\nRefresh the page in a few seconds to see results.`)
    } catch (error) {
      console.error('Failed to trigger workflow:', error)
      alert(`Failed to trigger workflow:\n\n${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsTriggering(false)
    }
  }

  if (stats === undefined || workflows === undefined || qaQueue === undefined) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ETL Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Resource discovery and validation status
          </p>
        </div>
        <Button
          onClick={handleTriggerWorkflow}
          disabled={isTriggering}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          {isTriggering ? 'Triggering...' : 'Trigger Workflow'}
        </Button>
      </div>

      {/* Stats Grid */}
      <StatsCards stats={stats} />

      {/* Recent Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workflows</CardTitle>
          <CardDescription>Last 10 ETL pipeline runs</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No workflows yet</p>
              <p className="text-sm mt-1">
                Workflows are created when the ETL pipeline discovers resources
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <WorkflowCard key={workflow._id} workflow={workflow} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QA Queue */}
      <Card>
        <CardHeader>
          <CardTitle>QA Queue</CardTitle>
          <CardDescription>
            Validated records pending human review ({qaQueue.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QAQueue records={qaQueue} />
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Current ETL pipeline settings (edit ETL_CONFIG.md to customize)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Search Query</div>
                <div className="text-sm font-mono">"caregiver resources and support services"</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Target State</div>
                <div className="text-sm font-mono">NY</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Results Limit</div>
                <div className="text-sm font-mono">10 sources</div>
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-sm">
              <div className="font-semibold mb-2">What happens when you trigger a workflow:</div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Discovery: Semantic search for caregiver resources using Exa.ai (neural search)</li>
                <li>Extraction: Scrape structured data from each source using GPT-4o-mini + Browser Rendering</li>
                <li>Categorization: Map service types to pressure zones</li>
                <li>Validation: Verify phone numbers (E.164) and URLs (HEAD requests)</li>
                <li>QA Queue: Records appear above for human review before production</li>
              </ol>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Tip: Edit</span>
              <code className="px-2 py-1 bg-muted rounded">give-care-etl/ETL_CONFIG.md</code>
              <span>to customize search query, state, and limits</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}
