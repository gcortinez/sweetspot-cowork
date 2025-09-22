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
  Palette,
  ChevronDown,
  ChevronRight,
  Calendar
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

interface NavigationItem {
  label: string
  href: string
  icon: any
  active: boolean
  permission?: Resource
}

interface NavigationSection {
  label: string
  icon: any
  items: NavigationItem[]
  isOpen: boolean
  permission?: Resource
}

export function Sidebar({ className = '', onCreateLead }: SidebarProps) {
  const [isMounted, setIsMounted] = React.useState(false)
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    crm: false,
    operación: true,
    administración: false,
    reportes: false
  })
  const { user } = useAuth()
  const pathname = usePathname()
  const { selectedCowork, isPlatformView } = useCoworkSelection()
  const navPermissions = useNavigationPermissions()

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Auto-open sections that contain active items
  React.useEffect(() => {
    if (pathname.startsWith('/spaces') || pathname.startsWith('/bookings')) {
      setOpenSections(prev => ({ ...prev, operación: true }))
    }
    if (pathname.startsWith('/leads') || pathname.startsWith('/opportunities') || pathname.startsWith('/clients') || pathname.startsWith('/services')) {
      setOpenSections(prev => ({ ...prev, crm: true }))
    }
    if (pathname.startsWith('/admin') || pathname.startsWith('/users')) {
      setOpenSections(prev => ({ ...prev, administración: true }))
    }
    if (pathname.startsWith('/reports')) {
      setOpenSections(prev => ({ ...prev, reportes: true }))
    }
  }, [pathname])

  // Toggle section open/close
  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  // Check if any item in a section is active
  const isSectionActive = (items: NavigationItem[]) => {
    return items.some(item => item.active)
  }

  // Build navigation sections based on permissions
  const getNavigationSections = (): NavigationSection[] => {
    // Platform view for Super Admin
    if (isPlatformView) {
      return [{
        label: 'Plataforma',
        icon: Database,
        isOpen: true,
        items: [{
          label: 'Vista General de la Plataforma',
          href: '/dashboard',
          icon: Database,
          active: pathname === '/dashboard'
        }]
      }]
    }

    const sections: NavigationSection[] = []

    // Dashboard (always visible first at root level)
    if (navPermissions.showDashboard) {
      sections.push({
        label: 'Dashboard',
        icon: Home,
        isOpen: true, // Always visible, not collapsible
        items: [{
          label: 'Dashboard',
          href: '/dashboard',
          icon: Home,
          active: pathname === '/dashboard'
        }]
      })
    }

    // CRM Section
    const crmItems: NavigationItem[] = []
    if (navPermissions.showLeads) {
      crmItems.push({
        label: 'Prospectos',
        href: '/leads',
        icon: Users,
        active: pathname.startsWith('/leads'),
        permission: Resource.PROSPECT_VIEW
      })
    }
    if (navPermissions.showOpportunities) {
      crmItems.push({
        label: 'Oportunidades',
        href: '/opportunities',
        icon: TrendingUp,
        active: pathname.startsWith('/opportunities'),
        permission: Resource.OPPORTUNITY_VIEW
      })
    }
    if (navPermissions.showClients) {
      crmItems.push({
        label: 'Clientes',
        href: '/clients',
        icon: UserCheck,
        active: pathname.startsWith('/clients'),
        permission: Resource.CLIENT_VIEW
      })
    }
    if (navPermissions.showServices) {
      crmItems.push({
        label: 'Servicios',
        href: '/services',
        icon: Wrench,
        active: pathname.startsWith('/services'),
        permission: Resource.SERVICE_VIEW
      })
    }

    if (crmItems.length > 0) {
      sections.push({
        label: 'CRM',
        icon: Target,
        isOpen: openSections.crm,
        items: crmItems
      })
    }

    // Operación Section
    const operacionItems: NavigationItem[] = []
    if (navPermissions.showSpaces) {
      operacionItems.push({
        label: 'Espacios',
        href: '/spaces',
        icon: Folder,
        active: pathname.startsWith('/spaces'),
        permission: Resource.SPACE_VIEW
      })
    }

    // Add Bookings/Reservations link
    if (navPermissions.showSpaces) {
      operacionItems.push({
        label: 'Reservas',
        href: '/bookings',
        icon: Calendar,
        active: pathname.startsWith('/bookings'),
        permission: Resource.SPACE_VIEW
      })
    }

    if (operacionItems.length > 0) {
      sections.push({
        label: 'Operación',
        icon: Settings,
        isOpen: openSections.operación,
        items: operacionItems
      })
    }

    // Admin Section
    const adminItems: NavigationItem[] = []
    if (navPermissions.showSpaceAdmin) {
      adminItems.push({
        label: 'Tipos de Espacio',
        href: '/admin/space-types',
        icon: Palette,
        active: pathname.startsWith('/admin/space-types'),
        permission: Resource.SPACE_EDIT
      })
    }
    if (navPermissions.showUsers) {
      adminItems.push({
        label: 'Gestión de Usuarios',
        href: '/users',
        icon: UserCog,
        active: pathname.startsWith('/users'),
        permission: Resource.USER_EDIT
      })
    }

    if (adminItems.length > 0) {
      sections.push({
        label: 'Administración',
        icon: Shield,
        isOpen: openSections.administración,
        items: adminItems
      })
    }

    // Reportes Section
    const reportesItems: NavigationItem[] = []
    if (navPermissions.showReports) {
      reportesItems.push({
        label: 'Reportes',
        href: '/reports',
        icon: BarChart3,
        active: pathname.startsWith('/reports')
      })
    }

    if (reportesItems.length > 0) {
      sections.push({
        label: 'Reportes',
        icon: BarChart3,
        isOpen: openSections.reportes,
        items: reportesItems
      })
    }

    return sections
  }

  const navigationSections = getNavigationSections()

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
        <div className="space-y-2">
          {/* Dashboard - Always visible at root level */}
          {navPermissions.showDashboard && (
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-10 px-3 mb-3 font-medium ${
                  pathname === '/dashboard'
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium border-l-2 border-purple-500'
                    : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                <Home className="h-4 w-4 mr-3" />
                Dashboard
              </Button>
            </Link>
          )}

          {/* Collapsible Sections */}
          {navigationSections.map((section, sectionIndex) => {
            // Skip Dashboard section since we render it separately above
            if (section.label === 'Dashboard') return null

            const SectionIcon = section.icon
            const isSectionActiveState = isSectionActive(section.items)
            const getSectionKey = (label: string): string => {
              switch (label) {
                case 'CRM': return 'crm'
                case 'Operación': return 'operación'
                case 'Administración': return 'administración'
                case 'Reportes': return 'reportes'
                default: return label.toLowerCase()
              }
            }
            const sectionKey = getSectionKey(section.label)

            return (
              <div key={`section-${sectionIndex}`} className="mb-2">
                {/* Section Header */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection(sectionKey)}
                  className={`w-full justify-between h-10 px-3 mb-1 font-medium ${
                    isSectionActiveState
                      ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center">
                    <SectionIcon className="h-4 w-4 mr-3" />
                    {section.label}
                  </div>
                  {section.isOpen ? (
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform" />
                  )}
                </Button>

                {/* Section Items */}
                {section.isOpen && (
                  <div className="ml-4 space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const ItemIcon = item.icon
                      return (
                        <Link key={`${section.label}-${itemIndex}`} href={item.href}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start h-9 px-3 text-sm ${
                              item.active
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium border-l-2 border-purple-500'
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
                )}
              </div>
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