'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Crown } from 'lucide-react'

// Lazy load admin components - using default exports directly
const PlatformStats = dynamic(
  () => import('@/components/admin/platform-stats'),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>,
    ssr: false
  }
)

const CoworkManagement = dynamic(
  () => import('@/components/admin/cowork-management'),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>,
    ssr: false
  }
)

const UserManagement = dynamic(
  () => import('@/components/admin/user-management'),
  { 
    loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>,
    ssr: false
  }
)

interface SuperAdminDashboardProps {
  user: any
}

export function SuperAdminDashboard({ user }: SuperAdminDashboardProps) {
  return (
    <div 
      className="w-full max-w-full overflow-hidden"
      style={{ 
        boxSizing: 'border-box'
      }}
    >
      <main 
        className="mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 w-full max-w-full overflow-hidden" 
        style={{
          boxSizing: 'border-box'
        }}
      >
        {/* Platform Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                Dashboard Super Admin
              </h2>
            </div>
            <p className="text-sm text-gray-600 pl-7">
              Vista general de toda la plataforma SweetSpot
            </p>
          </div>
        </div>

      {/* Platform Stats - Lazy loaded */}
      <Suspense fallback={<StatsSkeleton />}>
        <PlatformStats />
      </Suspense>

        {/* Platform Management Tabs */}
        <div className="mt-6 sm:mt-8 lg:mt-10">
          <div className="border-b border-gray-200 mb-4 sm:mb-6">
            <nav className="-mb-px flex overflow-x-auto">
              <div className="py-2 px-1 border-b-2 border-purple-600 text-purple-600 font-medium text-sm whitespace-nowrap">
                Gestión de Coworks
              </div>
            </nav>
          </div>
          
          {/* Cowork Management - Lazy loaded */}
          <Suspense fallback={<ManagementSkeleton />}>
            <CoworkManagement />
          </Suspense>
        </div>

        {/* User Management Section */}
        <div className="mt-6 sm:mt-8 lg:mt-10">
          <div className="border-b border-gray-200 mb-4 sm:mb-6">
            <nav className="-mb-px flex overflow-x-auto">
              <div className="py-2 px-1 border-b-2 border-purple-600 text-purple-600 font-medium text-sm whitespace-nowrap">
                Gestión de Usuarios
              </div>
            </nav>
          </div>
          
          {/* User Management - Lazy loaded */}
          <Suspense fallback={<ManagementSkeleton />}>
            <UserManagement />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

// Skeleton components
function StatsSkeleton() {
  return (
    <div className="w-full space-y-4 lg:space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-200 rounded-lg h-20 sm:h-24 lg:h-28"></div>
        ))}
      </div>
      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 rounded-lg h-48 sm:h-56"></div>
        ))}
      </div>
    </div>
  )
}

function ManagementSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-pulse">
      <div className="bg-gray-200 rounded-lg h-32 sm:h-40 lg:h-48"></div>
      <div className="bg-gray-200 rounded-lg h-20 sm:h-24 lg:h-28"></div>
    </div>
  )
}