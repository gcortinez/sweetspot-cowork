'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Crown,
  Home,
  Target,
  BarChart3,
  Settings,
  CreditCard,
  Users,
  UserCheck,
  FileText,
  Wrench,
  TrendingUp,
  Shield,
  Database,
  UserCog,
  Folder,
  Palette
} from 'lucide-react'
import { useAuth } from '@/contexts/clerk-auth-context'
import { useCoworkSelection } from '@/contexts/cowork-selection-context'
import { useNavigationPermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { CanAccess } from '@/components/guards/CanAccess'
import { Resource } from '@/lib/auth/permissions'

interface SidebarProps {
  className?: string
  onCreateLead?: () => void
}

export function Sidebar({ className = '', onCreateLead }: SidebarProps) {
  const [isMounted, setIsMounted] = React.useState(false)
  const { user } = useAuth()
  const pathname = usePathname()
  const { selectedCowork, isPlatformView } = useCoworkSelection()
  const navPermissions = useNavigationPermissions()

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Build navigation items based on permissions
  const getNavigationItems = () => {
    const items: Array<{
      label: string
      href: string
      icon: any
      active: boolean
      permission?: Resource
      separator?: boolean
    }> = []

    // Platform view for Super Admin
    if (isPlatformView) {
      items.push({
        label: 'Vista General de la Plataforma',
        href: '/dashboard',
        icon: Database,
        active: pathname === '/dashboard'
      })
      return items
    }

    // Dashboard (always visible)
    if (navPermissions.showDashboard) {
      items.push({
        label: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        active: pathname === '/dashboard'
      })
    }

    // CRM Section
    if (navPermissions.showLeads) {
      items.push({
        label: 'Prospectos',
        href: '/leads',
        icon: Users,
        active: pathname.startsWith('/leads'),
        permission: Resource.PROSPECT_VIEW
      })
    }

    if (navPermissions.showOpportunities) {
      items.push({
        label: 'Oportunidades',
        href: '/opportunities',
        icon: TrendingUp,
        active: pathname.startsWith('/opportunities'),
        permission: Resource.OPPORTUNITY_VIEW
      })
    }

    if (navPermissions.showClients) {
      items.push({
        label: 'Clientes',
        href: '/clients',
        icon: UserCheck,
        active: pathname.startsWith('/clients'),
        permission: Resource.CLIENT_VIEW
      })
    }

    if (navPermissions.showQuotations) {
      items.push({
        label: 'Cotizaciones',
        href: '/quotations',
        icon: FileText,
        active: pathname.startsWith('/quotations'),
        permission: Resource.QUOTATION_VIEW
      })
    }

    // Services
    if (navPermissions.showServices) {
      items.push({
        label: 'Servicios',
        href: '/services',
        icon: Wrench,
        active: pathname.startsWith('/services'),
        permission: Resource.SERVICE_VIEW
      })
    }

    // Spaces
    if (navPermissions.showSpaces) {
      items.push({
        label: 'Espacios',
        href: '/spaces',
        icon: Folder,
        active: pathname.startsWith('/spaces'),
        permission: Resource.SPACE_VIEW
      })
    }

    // Space Type Admin (for COWORK_ADMIN and SUPER_ADMIN)
    if (navPermissions.showSpaceAdmin) {
      items.push({
        label: 'Tipos de Espacio',
        href: '/admin/space-types',
        icon: Palette,
        active: pathname.startsWith('/admin/space-types'),
        permission: Resource.SPACE_EDIT
      })
    }

    // Admin Section Separator
    if (navPermissions.showUsers || navPermissions.showReports || navPermissions.showSpaceAdmin) {
      items.push({ separator: true } as any)
    }

    // User Management
    if (navPermissions.showUsers) {
      items.push({
        label: 'Gestión de Usuarios',
        href: '/users',
        icon: UserCog,
        active: pathname.startsWith('/users'),
        permission: Resource.USER_EDIT
      })
    }

    // Reports
    if (navPermissions.showReports) {
      items.push({
        label: 'Reportes',
        href: '/reports',
        icon: BarChart3,
        active: pathname.startsWith('/reports')
      })
    }

    return items
  }

  const navigationItems = getNavigationItems()

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Logo Section */}
      <div className="flex items-center p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center group-hover:shadow-lg shadow-purple-500/25 transition-all">
            {isMounted && isPlatformView ? (
              <Crown className="h-5 w-5 text-white" />
            ) : (
              <Building2 className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
              {selectedCowork ? selectedCowork.name : 'SweetSpot'}
            </h1>
            {isMounted && isPlatformView && (
              <p className="text-xs text-purple-600 font-medium">Vista General de la Plataforma</p>
            )}
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      {onCreateLead && !isPlatformView && (
        <CanAccess permission={Resource.PROSPECT_CREATE}>
          <div className="p-4 border-b border-gray-200">
            <Button
              onClick={onCreateLead}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              + Nuevo Prospecto
            </Button>
          </div>
        </CanAccess>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navigationItems.map((item, index) => {
            if (item.separator) {
              return (
                <div key={`separator-${index}`} className="h-px bg-gray-200 my-3"></div>
              )
            }

            const ItemIcon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-10 px-3 ${
                    item.active
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <ItemIcon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {isMounted && user && (
            <>
              {user.role === 'SUPER_ADMIN' ? (
                <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded mb-2 inline-block">
                  SUPER_ADMIN
                </span>
              ) : user.role === 'COWORK_ADMIN' ? (
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded mb-2 inline-block">
                  COWORK_ADMIN
                </span>
              ) : user.role === 'COWORK_USER' ? (
                <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded mb-2 inline-block">
                  COWORK_USER
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded mb-2 inline-block">
                  {user.role}
                </span>
              )}
              <br />
            </>
          )}
          <span className="text-gray-400">v1.0.0</span>
        </div>
      </div>
    </div>
  )
}