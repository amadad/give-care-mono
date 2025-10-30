import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MessageSquare, RotateCcw } from 'lucide-react'
import { formatPhoneNumber, getRelativeTime, getBurnoutVariant, cn } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export const Route = createFileRoute('/users/$userId')({
  component: () => (
    <ErrorBoundary>
      <UserDetailPage />
    </ErrorBoundary>
  ),
})

function UserDetailPage() {
  const { userId } = Route.useParams()
  const userDetails = useQuery(api["functions/admin"].getUserDetails, {
    userId: userId as Id<"users">
  })

  if (!userDetails) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const { user, conversations, wellnessHistory, assessments } = userDetails

  // Prepare wellness trend data
  const trendData = wellnessHistory
    .sort((a, b) => a.recordedAt - b.recordedAt)
    .map(w => ({
      date: new Date(w.recordedAt).toLocaleDateString(),
      score: w.score
    }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{user.firstName}</h1>
          <p className="text-muted-foreground">
            {user.relationship && `${user.relationship} • `}
            {formatPhoneNumber(user.phoneNumber)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Assessment
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Burnout Score</p>
            {user.burnoutScore !== undefined ? (
              <Badge variant={getBurnoutVariant(user.burnoutScore)} className="text-lg">
                {user.burnoutScore}
              </Badge>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Journey Phase</p>
            <Badge variant="outline" className="capitalize">
              {user.journeyPhase}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Subscription</p>
            <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'outline'} className="capitalize">
              {user.subscriptionStatus?.replace('_', ' ') || 'none'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Last Contact</p>
            <p className="text-sm font-medium">
              {user.lastContactAt ? getRelativeTime(user.lastContactAt) : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wellness Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Wellness Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No wellness data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Assessment History */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment History</CardTitle>
          </CardHeader>
          <CardContent>
            {assessments.length > 0 ? (
              <div className="space-y-3">
                {assessments.map((assessment) => (
                  <div key={assessment._id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium uppercase text-sm">{assessment.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {assessment.completedAt && new Date(assessment.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Score: {assessment.overallScore !== null ? assessment.overallScore : 'N/A'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No assessments completed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversation History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length > 0 ? (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  className={cn(
                    "p-4 rounded-lg",
                    conv.role === 'user' ? 'bg-accent ml-8' : 'bg-muted mr-8'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={conv.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                      {conv.role === 'user' ? 'User' : conv.agentName || 'Assistant'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(conv.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{conv.text}</p>
                  {conv.latency && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Response time: {conv.latency}ms
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No conversations yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
