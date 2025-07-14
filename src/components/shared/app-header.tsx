'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Building2, 
  Crown, 
  Bell,
  Home
} from 'lucide-react'
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
  const { user } = useUser()
  const {
    selectedCowork,
    isPlatformView,
    isLoadingCoworks
  } = useCoworkSelection()

  // Check if user is Super Admin
  const privateMetadata = user?.privateMetadata as any
  const publicMetadata = user?.publicMetadata as any
  const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link 
              href="/dashboard"
              className="flex items-center space-x-3 group"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center group-hover:opacity-80 transition-all ${
                isSuperAdmin ? 'bg-purple-600' : 'bg-blue-600'
              }`}>
                {isSuperAdmin ? (
                  <Crown className="h-5 w-5 text-white" />
                ) : (
                  <Building2 className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  SweetSpot
                </h1>
                {/* Cowork name display */}
                {!isLoadingCoworks && (
                  <div className="text-sm text-gray-600">
                    {isSuperAdmin ? (
                      isPlatformView ? (
                        <span className="text-purple-600 font-medium">Vista General de la Plataforma</span>
                      ) : (
                        selectedCowork ? (
                          <span className="text-blue-600 font-medium">{selectedCowork.name}</span>
                        ) : (
                          <span className="text-gray-500">Seleccionar Cowork</span>
                        )
                      )
                    ) : (
                      selectedCowork ? (
                        <span className="text-blue-600 font-medium">{selectedCowork.name}</span>
                      ) : (
                        <span className="text-gray-500">Cargando...</span>
                      )
                    )}
                  </div>
                )}
              </div>
            </Link>
            
            {/* Breadcrumb */}
            {showBreadcrumb && breadcrumbItems.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>/</span>
                <Link 
                  href="/dashboard" 
                  className="hover:text-blue-600 transition-colors flex items-center space-x-1"
                >
                  <Home className="h-3 w-3" />
                  <span>Dashboard</span>
                </Link>
                {breadcrumbItems.map((item, index) => (
                  <React.Fragment key={index}>
                    <span>/</span>
                    {item.href ? (
                      <Link 
                        href={item.href}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-gray-900">{item.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            {/* Cowork Selector for Super Admins */}
            {isSuperAdmin && <CoworkSelector />}
            
            {/* User Role Display */}
            {isSuperAdmin ? (
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Super Admin
              </span>
            ) : (
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {userRole}
              </div>
            )}
            
            <Bell className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            
            <div className="text-sm text-gray-600">
              Bienvenido, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
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