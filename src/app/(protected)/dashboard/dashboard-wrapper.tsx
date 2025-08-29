'use client'

import { useEffect, useState } from 'react'
import { useCoworkSelection } from '@/contexts/cowork-selection-context'
import { SuperAdminDashboard } from './super-admin-dashboard'
import DashboardClient from './dashboard-client'
import { getDashboardStats, getRecentActivities } from '@/lib/actions/dashboard-optimized'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'

interface DashboardWrapperProps {
  userData: any
  initialStats: any
  initialActivities: any[]
  error?: string | null
}

export default function DashboardWrapper({ 
  userData, 
  initialStats, 
  initialActivities, 
  error 
}: DashboardWrapperProps) {
  const { selectedCowork, isPlatformView, isSuperAdmin } = useCoworkSelection()
  const [contextStats, setContextStats] = useState(initialStats)
  const [contextActivities, setContextActivities] = useState(initialActivities)
  const [contextError, setContextError] = useState(error)
  const [isLoadingContext, setIsLoadingContext] = useState(false)

  // Load data for the selected cowork when Super Admin switches context
  useEffect(() => {
    if (isSuperAdmin && selectedCowork && !isPlatformView) {
      const loadCoworkData = async () => {
        setIsLoadingContext(true)
        try {
          const [statsResult, activitiesResult] = await Promise.all([
            getDashboardStats(selectedCowork.id),
            getRecentActivities(selectedCowork.id)
          ])
          
          setContextStats(statsResult.success ? statsResult.data : null)
          setContextActivities(activitiesResult.success ? activitiesResult.data : [])
          setContextError(!statsResult.success ? statsResult.error : null)
        } catch (err) {
          setContextError('Error al cargar datos del cowork')
          setContextStats(null)
          setContextActivities([])
        } finally {
          setIsLoadingContext(false)
        }
      }
      
      loadCoworkData()
    }
  }, [selectedCowork?.id, isPlatformView, isSuperAdmin])

  // Only show Super Admin Dashboard if user is actually SUPER_ADMIN role and in platform view
  if (userData.role === 'SUPER_ADMIN' && isSuperAdmin && isPlatformView) {
    return (
      <div className="w-full max-w-full overflow-hidden min-w-0">
        <SuperAdminDashboard user={userData} />
      </div>
    )
  }

  // Show loading state when switching context
  if (isLoadingContext) {
    return (
      <div className="w-full max-w-full overflow-hidden min-w-0">
        <DashboardSkeleton />
      </div>
    )
  }

  // If Super Admin has selected a cowork, or if regular user, show regular dashboard
  return (
    <div className="w-full max-w-full overflow-hidden min-w-0">
      <DashboardClient 
        user={userData}
        initialStats={contextStats}
        initialActivities={contextActivities}
        error={contextError}
      />
    </div>
  )
}