import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from "convex/_generated/api"
import { useState } from 'react'
import { UserTable } from '@/components/dashboard/UserTable'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Download } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const Route = createFileRoute('/users/')({
  component: () => (
    <ErrorBoundary>
      <UserListPage />
    </ErrorBoundary>
  ),
})

function UserListPage() {
  const [search, setSearch] = useState('')
  const [journeyPhase, setJourneyPhase] = useState<string | undefined>(undefined)
  const [burnoutBand, setBurnoutBand] = useState<string | undefined>(undefined)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | undefined>(undefined)

  const users = useQuery(api["functions/admin"].getAllUsers, {
    search: search || undefined,
    journeyPhase,
    burnoutBand,
    subscriptionStatus,
    limit: 50,
    cursor: undefined
  })

  const handleExportCSV = () => {
    if (!users?.users) return

    // Simple CSV export
    const headers = ['Name', 'Phone', 'Burnout Score', 'Journey Phase', 'Subscription']
    const rows = users.users.map(u => [
      u.firstName,
      u.phoneNumber,
      u.burnoutScore || 'N/A',
      u.journeyPhase,
      u.subscriptionStatus
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={handleExportCSV} disabled={!users?.users}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Journey Phase Filter */}
        <Select value={journeyPhase} onValueChange={(v) => setJourneyPhase(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Journey Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="crisis">Crisis</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>

        {/* Burnout Band Filter */}
        <Select value={burnoutBand} onValueChange={(v) => setBurnoutBand(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Burnout Band" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bands</SelectItem>
            <SelectItem value="crisis">Crisis</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="mild">Mild</SelectItem>
            <SelectItem value="thriving">Thriving</SelectItem>
          </SelectContent>
        </Select>

        {/* Subscription Filter */}
        <Select value={subscriptionStatus} onValueChange={(v) => setSubscriptionStatus(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subscription" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(search || journeyPhase || burnoutBand || subscriptionStatus) && (
          <Button
            variant="outline"
            onClick={() => {
              setSearch('')
              setJourneyPhase(undefined)
              setBurnoutBand(undefined)
              setSubscriptionStatus(undefined)
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* User Table */}
      <UserTable users={users?.users || []} isLoading={!users} />
    </div>
  )
}
