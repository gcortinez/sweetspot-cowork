'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPendingApprovalsCountAction } from '@/lib/actions/booking'

interface AdminNotificationBellProps {
  className?: string
  isSuperAdmin?: boolean
}

export function AdminNotificationBell({
  className,
  isSuperAdmin = false
}: AdminNotificationBellProps) {
  const [pendingCount, setPendingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        setIsLoading(true)
        const result = await getPendingApprovalsCountAction()
        if (result.success && result.data) {
          setPendingCount(result.data.count)
        }
      } catch (error) {
        console.error('Error fetching pending approvals count:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingCount()

    // Set up polling to refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Link href="/admin/booking-management">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "relative transition-colors duration-200",
          isSuperAdmin
            ? "text-purple-500 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/40"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800",
          className
        )}
        title={pendingCount > 0 ? `${pendingCount} reservas pendientes de aprobación` : 'Ver gestión de reservas'}
      >
        <Bell className="h-4 w-4" />
        {/* Show badge only if there are pending approvals */}
        {pendingCount > 0 && (
          <Badge
            className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-medium p-0 flex items-center justify-center",
              "bg-red-500 text-white border-2 border-white dark:border-gray-900",
              "min-w-5" // Ensure minimum width for double digit numbers
            )}
          >
            {pendingCount > 99 ? '99+' : pendingCount}
          </Badge>
        )}
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </Button>
    </Link>
  )
}