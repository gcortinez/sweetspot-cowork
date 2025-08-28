import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { getDashboardStats, getRecentActivities } from '@/lib/actions/dashboard-optimized'
import DashboardClient from './dashboard-client'
import DashboardWrapper from './dashboard-wrapper'
import { DashboardSkeleton, StatsSkeleton, ActivitiesSkeleton } from '@/components/skeletons/dashboard-skeleton'

// Configure page caching
export const revalidate = 60 // Revalidate every 60 seconds
export const dynamic = 'force-dynamic' // For now, until we optimize further

// Server Component - handles authentication and initial data fetching
export default async function DashboardPage() {
  // Server-side authentication check
  const user = await currentUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user metadata
  const privateMetadata = user.privateMetadata as any
  const publicMetadata = user.publicMetadata as any
  const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  // User data for client components
  const userData = {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    firstName: user.firstName,
    lastName: user.lastName,
    role: userRole,
    isSuperAdmin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      {/* Header Section - Static, can be rendered immediately */}
      <DashboardHeader user={userData} />
      
      {/* Main Content with Suspense for streaming */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent userData={userData} />
      </Suspense>
    </div>
  )
}

// Static header component
function DashboardHeader({ user }: { user: any }) {
  return (
    <header className="bg-gradient-to-r from-white via-purple-50/50 to-indigo-50/50 shadow-lg border-b border-purple-100/50 backdrop-blur-sm w-full overflow-hidden">
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="flex items-center justify-between h-16 min-w-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 truncate">SweetSpot Dashboard</h1>
          </div>
          <div className="text-sm text-gray-700 font-medium flex-shrink-0 truncate max-w-xs">
            Bienvenido, {user.firstName || user.email.split('@')[0]}
          </div>
        </div>
      </div>
    </header>
  )
}

// Async server component for dashboard content
async function DashboardContent({ userData }: { userData: any }) {
  // Fetch dashboard data in parallel
  const [statsResult, activitiesResult] = await Promise.all([
    getDashboardStats(),
    getRecentActivities()
  ])

  // Use the wrapper to handle context-aware rendering
  return (
    <DashboardWrapper 
      userData={userData}
      initialStats={statsResult.success ? statsResult.data : null}
      initialActivities={activitiesResult.success ? activitiesResult.data : []}
      error={!statsResult.success ? statsResult.error : null}
    />
  )
}