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
  TrendingUp
} from '@/lib/icons'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  className?: string
  onCreateLead?: () => void
}

export function Sidebar({ className = '', onCreateLead }: SidebarProps) {
  const [isMounted, setIsMounted] = React.useState(false)
  const { user } = useUser()
  const pathname = usePathname()

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Check if user is Super Admin
  const privateMetadata = user?.privateMetadata as any
  const publicMetadata = user?.publicMetadata as any
  const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  // Navigation items - all in one list for now (simpler)
  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: pathname === '/dashboard'
    },
    {
      label: 'Prospectos',
      href: '/leads',
      icon: Users,
      active: pathname.startsWith('/leads')
    },
    {
      label: 'Oportunidades',
      href: '/opportunities',
      icon: TrendingUp,
      active: pathname.startsWith('/opportunities')
    },
    {
      label: 'Clientes',
      href: '/clients',
      icon: UserCheck,
      active: pathname.startsWith('/clients')
    },
    {
      label: 'Cotizaciones',
      href: '/quotations',
      icon: FileText,
      active: pathname.startsWith('/quotations')
    },
    {
      label: 'Servicios',
      href: '/services',
      icon: Wrench,
      active: pathname.startsWith('/services')
    }
  ]

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Logo Section */}
      <div className="flex items-center p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center group-hover:shadow-lg shadow-purple-500/25 transition-all">
            {isMounted && isSuperAdmin ? (
              <Crown className="h-5 w-5 text-white" />
            ) : (
              <Building2 className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
              SweetSpot
            </h1>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      {onCreateLead && (
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={onCreateLead}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            + Nuevo Prospecto
          </Button>
        </div>
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
          {isMounted && (
            <>
              {isSuperAdmin ? (
                <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded mb-2 inline-block">
                  SUPER_ADMIN
                </span>
              ) : userRole === 'COWORK_ADMIN' ? (
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded mb-2 inline-block">
                  COWORK_ADMIN
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded mb-2 inline-block">
                  {userRole}
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