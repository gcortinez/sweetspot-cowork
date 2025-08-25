'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { Sidebar } from '@/components/layout/Sidebar'
import dynamic from 'next/dynamic'

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Fixed on the left */}
      {!hideSidebar && (
        <div className="w-64 flex-shrink-0">
          <div className="fixed top-0 left-0 w-64 h-full">
            <Sidebar onCreateLead={() => setShowCreateLeadModal(true)} />
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <AppHeader currentPage={getCurrentPageTitle()} />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
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