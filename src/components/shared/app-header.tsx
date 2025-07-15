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
    <header className="bg-card shadow-soft border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link 
              href="/dashboard"
              className="flex items-center space-x-3 group"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-purple to-purple-700 flex items-center justify-center group-hover:shadow-purple shadow-soft transition-all">
                {isMounted && isSuperAdmin ? (
                  <Crown className="h-5 w-5 text-white" />
                ) : (
                  <Building2 className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground group-hover:text-brand-purple transition-colors">
                  SweetSpot
                </h1>
                {/* Cowork name display */}
                {isMounted && !isLoadingCoworks && (
                  <div className="text-sm text-muted-foreground">
                    {isSuperAdmin ? (
                      isPlatformView ? (
                        <span className="text-brand-purple font-medium">Vista General de la Plataforma</span>
                      ) : (
                        selectedCowork ? (
                          <span className="text-brand-blue font-medium">{selectedCowork.name}</span>
                        ) : (
                          <span className="text-muted-foreground">Seleccionar Cowork</span>
                        )
                      )
                    ) : (
                      selectedCowork ? (
                        <span className="text-brand-blue font-medium">{selectedCowork.name}</span>
                      ) : (
                        <span className="text-muted-foreground">Cargando...</span>
                      )
                    )}
                  </div>
                )}
              </div>
            </Link>
            
            {/* Breadcrumb */}
            {showBreadcrumb && breadcrumbItems.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>/</span>
                <Link 
                  href="/dashboard" 
                  className="hover:text-brand-blue transition-colors flex items-center space-x-1"
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
                        className="hover:text-brand-blue transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-foreground">{item.label}</span>
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
              <span className="bg-brand-purple/10 text-brand-purple text-xs font-medium px-2.5 py-0.5 rounded shadow-soft">
                Super Admin
              </span>
            ) : (
              <div className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-1 rounded shadow-soft">
                {userRole}
              </div>
            )}
            
            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
            
            <div className="text-sm text-muted-foreground">
              Bienvenido, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </div>
            
            <SignOutButton>
              <button className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-md text-sm transition-colors">
                Cerrar Sesión
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </header>
  )
}