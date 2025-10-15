import { Link } from '@tanstack/react-router'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPhoneNumber, getRelativeTime, getBurnoutVariant } from '@/lib/utils'
import { Eye } from 'lucide-react'

interface User {
  _id: string
  firstName: string
  relationship?: string
  phoneNumber: string
  burnoutScore?: number
  burnoutBand?: string
  journeyPhase: string
  subscriptionStatus?: string
  lastContactAt?: number
  createdAt: number
}

interface UserTableProps {
  users: User[]
  isLoading: boolean
}

export function UserTable({ users, isLoading }: UserTableProps) {
  // Guard against undefined/null
  if (!users && !isLoading) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Unable to load users</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
          variant="outline"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Burnout</TableHead>
              <TableHead>Journey</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No users found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Burnout</TableHead>
            <TableHead>Journey</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell className="font-medium">
                <div>
                  <div>{user.firstName}</div>
                  {user.relationship && (
                    <div className="text-xs text-muted-foreground">{user.relationship}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatPhoneNumber(user.phoneNumber)}
              </TableCell>
              <TableCell>
                {user.burnoutScore !== undefined ? (
                  <Badge variant={getBurnoutVariant(user.burnoutScore)}>
                    {user.burnoutScore}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {user.journeyPhase}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.subscriptionStatus === 'active' ? 'default' : 'outline'}
                  className="capitalize"
                >
                  {user.subscriptionStatus?.replace('_', ' ') || 'none'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.lastContactAt ? getRelativeTime(user.lastContactAt) : 'Never'}
              </TableCell>
              <TableCell>
                <Link to="/users/$userId" params={{ userId: user._id }}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination TODO */}
      <div className="p-4 border-t text-sm text-muted-foreground text-center">
        Showing {users.length} users
      </div>
    </div>
  )
}
