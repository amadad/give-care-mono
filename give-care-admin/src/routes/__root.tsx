import { createRootRoute, Outlet, useLocation, Navigate } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Authenticated, Unauthenticated } from "convex/react"
import { Skeleton } from '@/components/ui/skeleton'
import { useConvexAuth } from "convex/react"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { isLoading } = useConvexAuth()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  // Show loading state while auth initializes
  if (isLoading && !isLoginPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  // Login page - no layout
  if (isLoginPage) {
    return <Outlet />
  }

  // Protected routes - require authentication
  return (
    <>
      <Unauthenticated>
        <Navigate to="/login" />
      </Unauthenticated>

      <Authenticated>
        <div className="flex h-screen bg-background">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </Authenticated>
    </>
  )
}
