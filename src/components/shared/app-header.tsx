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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Current page info and cowork name */}
          <div className="flex items-center space-x-4">
            {/* Current page title */}
            {currentPage && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{currentPage}</h2>
              </div>
            )}
            
            {/* Cowork name display */}
            {isMounted && selectedCowork && (
              <div className="text-sm text-gray-500 border-l pl-4">
                {selectedCowork.name}
              </div>
            )}
          </div>
          
          {/* Right section: User actions */}
          <div className="flex items-center space-x-4">
            {/* Cowork Selector for Super Admins */}
            {isSuperAdmin && <CoworkSelector />}
            
            {/* User Role Display */}
            {isMounted && (
              <>
                {isSuperAdmin ? (
                  <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-0.5 rounded">
                    SUPER_ADMIN
                  </span>
                ) : userRole === 'COWORK_ADMIN' ? (
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded">
                    COWORK_ADMIN
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded">
                    {userRole}
                  </span>
                )}
              </>
            )}
            
            <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors" />
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user?.firstName || 'Usuario'}</span>
            </div>
            
            <SignOutButton>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm transition-colors">
                Cerrar Sesión
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </header>
  )
}