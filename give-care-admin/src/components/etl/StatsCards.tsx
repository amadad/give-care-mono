import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Database, CheckCircle2, Clock, LucideIcon } from 'lucide-react'

interface DashboardStats {
  workflows: {
    total: number
    running: number
    completed: number
    failed: number
  }
  records: {
    sources: number
    extracted: number
    validated: number
  }
  qa: {
    pending: number
    approved: number
  }
}

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: LucideIcon
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
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

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
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
  )
}
