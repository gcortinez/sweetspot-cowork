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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Platform Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Dashboard Super Admin
              </h2>
              <p className="text-gray-600">
                Vista general de toda la plataforma SweetSpot
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats - Lazy loaded */}
      <Suspense fallback={<StatsSkeleton />}>
        <PlatformStats />
      </Suspense>

      {/* Platform Management Tabs */}
      <div className="mt-12">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <div className="py-2 px-1 border-b-2 border-purple-600 text-purple-600 font-medium text-sm">
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
      <div className="mt-12">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <div className="py-2 px-1 border-b-2 border-purple-600 text-purple-600 font-medium text-sm">
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
  )
}

// Skeleton components
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
      ))}
    </div>
  )
}

function ManagementSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-gray-200 rounded-lg h-64"></div>
      <div className="bg-gray-200 rounded-lg h-32"></div>
    </div>
  )
}