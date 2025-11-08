import { useQuery } from 'convex/react'
import { api } from "convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react'

export function QualityMetrics() {
  const metrics = useQuery(api["functions/analytics"].getQualityMetrics, { days: 30 })
  const recentFeedback = useQuery(api["functions/analytics"].getRecentFeedback, { limit: 10 })

  if (!metrics || !recentFeedback) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const getTrendIcon = (change: number) => {
    if (change > 0.1) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (change < -0.1) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <ArrowRight className="h-4 w-4 text-gray-500" />
  }

  const getDimensionLabel = (dim: string) => {
    return dim.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Quality Metric Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Trends (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.avgRatings.map((dim) => {
              const change = metrics.changes.find(c => c.dimension === dim.dimension)?.change || 0
              return (
                <Card key={dim.dimension}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">
                      {getDimensionLabel(dim.dimension)}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold">
                        {dim.avgRating.toFixed(1)}/5
                      </span>
                      {getTrendIcon(change)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {change > 0 ? '+' : ''}{change.toFixed(1)} vs last week
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {dim.count} ratings
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Show message if no data */}
          {metrics.avgRatings.every(m => m.count === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No evaluation data yet</p>
              <p className="text-sm">Quality metrics will appear here once the evaluation framework is running</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback (Last 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentFeedback.length > 0 ? (
            <div className="space-y-4">
              {recentFeedback.map((feedback) => (
                <div key={feedback._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{feedback.userName}</span>
                      <Badge variant="outline">{feedback.rating}⭐</Badge>
                      <span className="text-sm text-muted-foreground">{feedback.timeAgo}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Conversation
                    </Button>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">
                      {getDimensionLabel(feedback.dimension)}:
                    </span>{' '}
                    {feedback.feedbackText || '(No comment)'}
                  </div>
                  <Badge variant="outline" className="text-xs mt-2">
                    Source: {feedback.source}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No feedback collected yet</p>
              <p className="text-sm">User ratings and GPT-4 judge evaluations will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
