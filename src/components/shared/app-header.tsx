'use client'

import React from 'react'
import { Bell } from '@/lib/icons'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { useCoworkSelection } from '@/contexts/cowork-selection-context'
import { CoworkSelector } from '@/components/admin/cowork-selector'

interface AppHeaderProps {
  currentPage?: string
  showBreadcrumb?: boolean
  breadcrumbItems?: Array<{
    label: string
    href?: string
  }>
}

export function AppHeader({ 
  currentPage,
  showBreadcrumb = false,
  breadcrumbItems = []
}: AppHeaderProps) {
  const [isMounted, setIsMounted] = React.useState(false)
  const { user } = useUser()
  const {
    selectedCowork,
    isPlatformView,
    isLoadingCoworks
  } = useCoworkSelection()

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Check if user is Super Admin
  const privateMetadata = user?.privateMetadata as any
  const publicMetadata = user?.publicMetadata as any
  const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200">
      <div className="w-full max-w-full mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 min-w-0">
          {/* Left section: Current page info and cowork name */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            {/* Current page title */}
            {currentPage && (
              <div className="min-w-0">
                <h2 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">{currentPage}</h2>
              </div>
            )}
            
            {/* Cowork name display */}
            {isMounted && selectedCowork && (
              <div className="hidden sm:block text-sm text-gray-500 border-l pl-4 truncate">
                {selectedCowork.name}
              </div>
            )}
          </div>
          
          {/* Right section: User actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
            {/* Cowork Selector for Super Admins */}
            {isSuperAdmin && <CoworkSelector />}
            
            {/* User Role Display */}
            {isMounted && (
              <>
                {isSuperAdmin ? (
                  <span className="hidden sm:inline bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-0.5 rounded whitespace-nowrap">
                    SUPER_ADMIN
                  </span>
                ) : userRole === 'COWORK_ADMIN' ? (
                  <span className="hidden sm:inline bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded whitespace-nowrap">
                    COWORK_ADMIN
                  </span>
                ) : (
                  <span className="hidden sm:inline bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded whitespace-nowrap">
                    {userRole}
                  </span>
                )}
              </>
            )}
            
            <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors flex-shrink-0" />
            
            <div className="hidden sm:block text-sm text-gray-600">
              <span className="font-medium truncate">{user?.firstName || 'Usuario'}</span>
            </div>
            
            <SignOutButton>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm transition-colors whitespace-nowrap">
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </header>
  )
}