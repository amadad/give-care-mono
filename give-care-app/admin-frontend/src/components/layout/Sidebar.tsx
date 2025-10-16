import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  BarChart3,
  Activity,
  GitBranch,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Crisis',
    href: '/crisis',
    icon: AlertTriangle,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Traces',
    href: '/traces',
    icon: GitBranch,
  },
  {
    title: 'System',
    href: '/system',
    icon: Activity,
  },
  {
    title: 'ETL Pipeline',
    href: '/etl',
    icon: Database,
  },
]

// Shared navigation content (used in both desktop sidebar and mobile sheet)
function SidebarContent() {
  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <img
          src="/gc-logo.svg"
          alt="GiveCare"
          className="h-6 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              '[&.active]:bg-primary [&.active]:text-primary-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        GiveCare v0.6.0
      </div>
    </>
  )
}

// Desktop permanent sidebar (hidden on mobile)
export function Sidebar() {
  return (
    <div className="hidden md:flex w-64 bg-card border-r border-border flex-col">
      <SidebarContent />
    </div>
  )
}

// Mobile drawer sidebar
export function MobileSidebar({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full bg-card">
          <SidebarContent />
        </div>
      </SheetContent>
    </Sheet>
  )
}
