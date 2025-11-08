import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from "convex/_generated/api"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { User, LayoutDashboard, Users, AlertTriangle, BarChart3, Activity, GitBranch } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchCommandProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Search users when debounced search term is provided
  const searchResults = useQuery(
    api["functions/admin"].getAllUsers,
    debouncedSearch.length >= 2
      ? {
          search: debouncedSearch,
          limit: 5,
        }
      : "skip"
  )

  // Reset search on close
  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  // Close dialog and navigate
  const runCommand = (callback: () => void) => {
    onOpenChange(false)
    callback()
  }

  // Navigation shortcuts
  const pages = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Users', icon: Users, path: '/users' },
    { name: 'Crisis Alerts', icon: AlertTriangle, path: '/crisis' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Traces', icon: GitBranch, path: '/traces' },
    { name: 'System Health', icon: Activity, path: '/system' },
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search users, pages..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Pages */}
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => runCommand(() => navigate({ to: page.path }))}
            >
              <page.icon className="mr-2 h-4 w-4" />
              {page.name}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* User Search Results */}
        {searchResults && searchResults.users.length > 0 && (
          <CommandGroup heading="Users">
            {searchResults.users.map((user) => (
              <CommandItem
                key={user._id}
                onSelect={() =>
                  runCommand(() =>
                    navigate({ to: `/users/$userId`, params: { userId: user._id } })
                  )
                }
              >
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{user.firstName || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.phoneNumber}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
