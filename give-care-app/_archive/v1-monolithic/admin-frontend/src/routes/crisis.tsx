import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from "convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, MessageSquare, Eye, Clock } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export const Route = createFileRoute('/crisis')({
  component: () => (
    <ErrorBoundary>
      <CrisisPage />
    </ErrorBoundary>
  ),
})

function CrisisPage() {
  const alerts = useQuery(api["functions/admin"].getCrisisAlerts)

  if (!alerts) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Crisis Management</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const { crisisUsers, pendingFollowups } = alerts

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Crisis Management</h1>
        <Badge variant="destructive" className="text-sm px-3 py-1">
          {crisisUsers.length + pendingFollowups.length} Active Alerts
        </Badge>
      </div>

      {/* Overview Alert */}
      {(crisisUsers.length > 0 || pendingFollowups.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Immediate Attention Required</AlertTitle>
          <AlertDescription>
            {crisisUsers.length} users in crisis band (burnout ≥80) and {pendingFollowups.length} pending follow-ups
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Critical Alerts ({crisisUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {crisisUsers.length > 0 ? (
              <div className="space-y-4">
                {crisisUsers.map((user) => (
                  <div key={user._id} className="p-4 border border-destructive rounded-lg bg-destructive/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">{user.firstName}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {formatPhoneNumber(user.phoneNumber)}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-lg">
                        {user.burnoutScore}
                      </Badge>
                    </div>

                    {user.pressureZones.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Pressure Zones:</p>
                        <div className="flex flex-wrap gap-1">
                          {user.pressureZones.map((zone) => (
                            <Badge key={zone} variant="outline" className="text-xs capitalize">
                              {zone.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link to="/users/$userId" params={{ userId: user._id }}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button size="sm" variant="destructive">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Send Check-In
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No users in crisis band
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pending Follow-Ups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Pending Follow-Ups ({pendingFollowups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingFollowups.length > 0 ? (
              <div className="space-y-4">
                {pendingFollowups.map((user) => (
                  <div key={user._id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{user.firstName}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {formatPhoneNumber(user.phoneNumber)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        Stage {user.crisisFollowupCount}/7
                      </Badge>
                    </div>

                    {/* Countdown Timer */}
                    <div className="mb-3 p-2 bg-orange-100 dark:bg-orange-950 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Next Follow-Up:</span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                          {user.hoursUntilNextFollowup < 1
                            ? 'Due now'
                            : `${user.hoursUntilNextFollowup.toFixed(1)}h`}
                        </span>
                      </div>
                      {user.hoursUntilNextFollowup < 2 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          ⚠️ Overdue or due soon
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link to="/users/$userId" params={{ userId: user._id }}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button size="sm">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Send Now
                      </Button>
                      <Button size="sm" variant="ghost">
                        Snooze 4h
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No pending follow-ups
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Crisis Protocol Reminder */}
      <Card>
        <CardHeader>
          <CardTitle>Crisis Protocol Reminder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Immediate Action Required:</strong> Users with burnout ≥80 must receive check-in within 24 hours</p>
          <p><strong>7-Stage Follow-Up:</strong> After initial crisis event, follow up every 24h for 7 days (decreasing frequency)</p>
          <p><strong>Escalation Resources:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
            <li>988 Suicide & Crisis Lifeline</li>
            <li>Crisis Text Line: Text "HELLO" to 741741</li>
            <li>911 for immediate emergencies</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
