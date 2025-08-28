'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { Sidebar } from '@/components/layout/Sidebar'
import dynamic from 'next/dynamic'
import { Menu, X } from 'lucide-react'

// Lazy load modals to avoid loading them unnecessarily
const CreateLeadModal = dynamic(
  () => import('@/components/leads/CreateLeadModal'),
  { 
    loading: () => <div className="animate-pulse">Cargando...</div>,
    ssr: false 
  }
)

export default function ProtectedLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Don't show sidebar on certain pages
  const hideSidebar = pathname === '/onboarding' || pathname === '/invitation/accept'

  const handleLeadCreated = () => {
    setShowCreateLeadModal(false)
    // Could add toast notification here
  }

  // Get current page title for header
  const getCurrentPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname.startsWith('/leads')) return 'Gestión de Prospectos'
    if (pathname.startsWith('/opportunities')) return 'Oportunidades'
    if (pathname.startsWith('/clients')) return 'Clientes'
    if (pathname.startsWith('/quotations')) return 'Cotizaciones'
    if (pathname.startsWith('/services')) return 'Servicios'
    if (pathname.startsWith('/analytics')) return 'Analítica'
    if (pathname.startsWith('/operations')) return 'Operaciones'
    if (pathname.startsWith('/billing')) return 'Facturación'
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {!hideSidebar && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold text-gray-900">Menú</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onCreateLead={() => setShowCreateLeadModal(true)} />
          </div>
        </div>
      )}
      
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - Hidden on mobile */}
        {!hideSidebar && (
          <div className="hidden lg:flex w-64 flex-shrink-0">
            <div className="fixed top-0 left-0 w-64 h-full">
              <Sidebar onCreateLead={() => setShowCreateLeadModal(true)} />
            </div>
          </div>
        )}
        
        {/* Main content area */}
        <div className={`flex-1 flex flex-col ${!hideSidebar ? 'lg:ml-0' : ''}`}>
          {/* Header with mobile menu button */}
          <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-3 sm:px-4 lg:px-6">
              {/* Mobile menu button */}
              {!hideSidebar && (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 flex-shrink-0 mr-2"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              
              {/* Header content */}
              <div className="flex-1 min-w-0">
                <AppHeader currentPage={getCurrentPageTitle()} />
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="w-full min-h-0 max-w-full overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Global modals */}
      {showCreateLeadModal && (
        <CreateLeadModal 
          isOpen={showCreateLeadModal}
          onClose={() => setShowCreateLeadModal(false)}
          onLeadCreated={handleLeadCreated}
        />
      )}
    </div>
  )
}