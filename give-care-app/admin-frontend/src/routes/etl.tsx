import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Database,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

export const Route = createFileRoute('/etl')({
  component: ETLDashboard,
})

function ETLDashboard() {
  const stats = useQuery(api.etl.getDashboardStats)
  const workflows = useQuery(api.etl.listWorkflows, { limit: 10 })
  const qaQueue = useQuery(api.etl.getQAQueue, { limit: 20 })

  if (stats === undefined || workflows === undefined || qaQueue === undefined) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">ETL Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          Resource discovery and validation status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Workflows"
          value={stats.workflows.total}
          description={`${stats.workflows.running} running, ${stats.workflows.completed} completed`}
          icon={Activity}
        />
        <StatCard
          title="Sources Discovered"
          value={stats.records.sources}
          description="Authoritative sources found"
          icon={Database}
        />
        <StatCard
          title="Records Extracted"
          value={stats.records.extracted}
          description={`${stats.records.validated} validated`}
          icon={CheckCircle2}
        />
        <StatCard
          title="QA Queue"
          value={stats.qa.pending}
          description={`${stats.qa.approved} approved`}
          icon={Clock}
        />
      </div>

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
          {qaQueue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No records pending QA</p>
            </div>
          ) : (
            <div className="space-y-3">
              {qaQueue.slice(0, 5).map((record) => (
                <QARecordCard key={record._id} record={record} />
              ))}
              {qaQueue.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {qaQueue.length - 5} more records
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon
}: {
  title: string
  value: number
  description: string
  icon: any
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function WorkflowCard({ workflow }: { workflow: any }) {
  const startedAt = new Date(workflow.startedAt)
  const duration = workflow.durationMs
    ? `${(workflow.durationMs / 1000).toFixed(1)}s`
    : 'Running...'

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{workflow.task}</h4>
          <StatusBadge status={workflow.status} />
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span>{startedAt.toLocaleString()}</span>
          <span>•</span>
          <span>{workflow.currentStep}</span>
          <span>•</span>
          <span>{duration}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold">{workflow.sourcesCount}</div>
          <div className="text-muted-foreground text-xs">sources</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{workflow.extractedCount}</div>
          <div className="text-muted-foreground text-xs">extracted</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{workflow.validatedCount}</div>
          <div className="text-muted-foreground text-xs">validated</div>
        </div>
        {workflow.errorCount > 0 && (
          <div className="text-center">
            <div className="font-semibold text-destructive">{workflow.errorCount}</div>
            <div className="text-muted-foreground text-xs">errors</div>
          </div>
        )}
      </div>
    </div>
  )
}

function QARecordCard({ record }: { record: any }) {
  const validatedAt = new Date(record.validatedAt)

  return (
    <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{record.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{record.providerName}</p>
          <div className="flex items-center gap-2 mt-2">
            <a
              href={record.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              {record.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {record.serviceTypes.map((type: string) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-lg">{record.qualityScore}/10</div>
          <div className="text-xs text-muted-foreground">quality</div>
          <div className="text-xs text-muted-foreground mt-2">
            {validatedAt.toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    running: { label: 'Running', className: 'bg-blue-500/10 text-blue-500', icon: Activity },
    completed: { label: 'Completed', className: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
    failed: { label: 'Failed', className: 'bg-red-500/10 text-red-500', icon: XCircle },
    paused: { label: 'Paused', className: 'bg-yellow-500/10 text-yellow-500', icon: AlertTriangle },
  }

  const variant = variants[status as keyof typeof variants] || variants.paused
  const Icon = variant.icon

  return (
    <Badge variant="secondary" className={variant.className}>
      <Icon className="h-3 w-3 mr-1" />
      {variant.label}
    </Badge>
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
