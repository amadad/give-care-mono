import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SummaryPerformance() {
  const stats = useQuery(api['functions/analytics'].getSummaryPerformance)

  if (!stats) {
    return <Skeleton className="h-64" />
  }

  if (stats.versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversation Summaries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No summary data available yet. Summaries with version metadata will appear here once the summarization job runs.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Summaries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryStat label="Total Summaries" value={stats.totals.totalSummaries.toLocaleString()} />
          <SummaryStat
            label="Distinct Versions"
            value={stats.totals.distinctVersions.toLocaleString()}
          />
          <SummaryStat
            label="Avg Cost"
            value={`$${stats.totals.avgCostUsd.toFixed(4)}`}
            description="Per summary"
          />
          <SummaryStat
            label="Avg Tokens"
            value={stats.totals.avgTokens.toLocaleString()}
            description="Per summary"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg">
            <thead>
              <tr className="bg-muted text-left">
                <th className="px-4 py-2 font-medium">Version</th>
                <th className="px-4 py-2 font-medium">Users</th>
                <th className="px-4 py-2 font-medium">Avg Tokens</th>
                <th className="px-4 py-2 font-medium">Avg Cost</th>
              </tr>
            </thead>
            <tbody>
              {stats.versions.map((version) => (
                <tr key={version.version} className="border-t">
                  <td className="px-4 py-2 capitalize">{version.version}</td>
                  <td className="px-4 py-2">{version.count.toLocaleString()}</td>
                  <td className="px-4 py-2">{version.avgTokens.toLocaleString()}</td>
                  <td className="px-4 py-2">{'$' + version.avgCostUsd.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryStat({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description?: string
}) {
  return (
    <div className="bg-accent/60 rounded-lg p-4">
      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {description ? <p className="text-xs text-muted-foreground mt-1">{description}</p> : null}
    </div>
  )
}
