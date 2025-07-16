'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  Target, 
  UserCheck, 
  FileText, 
  Zap, 
  BarChart3,
  PlusCircle,
  Users,
  Calendar,
  Settings,
  Home
} from 'lucide-react'

interface CRMNavigationProps {
  onCreateLead?: () => void
  onCreateQuotation?: () => void
}

interface NavigationItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const navigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Vista general del CRM'
  },
  {
    href: '/leads',
    label: 'Prospectos',
    icon: UserCheck,
    description: 'Gestión de leads'
  },
  {
    href: '/opportunities',
    label: 'Oportunidades',
    icon: Target,
    description: 'Pipeline de ventas'
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: Building2,
    description: 'Base de clientes'
  },
  {
    href: '/quotations',
    label: 'Cotizaciones',
    icon: FileText,
    description: 'Propuestas y cotizaciones'
  },
  {
    href: '/services',
    label: 'Servicios',
    icon: Zap,
    description: 'Catálogo de servicios'
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Reportes y análisis'
  }
]

export default function CRMNavigation({ onCreateLead, onCreateQuotation }: CRMNavigationProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Navigation Items */}
          <nav className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`transition-colors ${
                      active
                        ? 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                        : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Nueva Cotización */}
            {onCreateQuotation && (
              <Button
                onClick={onCreateQuotation}
                size="sm"
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 transition-colors"
              >
                <FileText className="h-4 w-4 mr-2" />
                Nueva Cotización
              </Button>
            )}

            {/* Nuevo Prospecto */}
            {onCreateLead && (
              <Button
                onClick={onCreateLead}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nuevo Prospecto
              </Button>
            )}

            {/* Acceso directo a nueva cotización desde cualquier página */}
            <Link href="/quotations">
              <Button
                size="sm"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Ir a Cotizaciones
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Breadcrumb component for better navigation
export function CRMBreadcrumb({ 
  items 
}: { 
  items: { label: string; href?: string }[] 
}) {
  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex py-2 text-sm">
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              {item.href ? (
                <Link 
                  href={item.href}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-600">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  )
}