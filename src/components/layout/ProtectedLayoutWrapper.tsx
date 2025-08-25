'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import CRMNavigation from '@/components/navigation/CRMNavigation'
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

  // Don't show navigation on certain pages
  const hideNavigation = pathname === '/onboarding' || pathname === '/invitation/accept'

  const handleLeadCreated = () => {
    setShowCreateLeadModal(false)
    // Could add toast notification here
  }

  return (
    <>
      {!hideNavigation && (
        <CRMNavigation 
          onCreateLead={() => setShowCreateLeadModal(true)}
        />
      )}
      
      <div className={hideNavigation ? '' : 'min-h-screen bg-gray-50'}>
        {children}
      </div>

      {/* Global modals */}
      {showCreateLeadModal && (
        <CreateLeadModal 
          isOpen={showCreateLeadModal}
          onClose={() => setShowCreateLeadModal(false)}
          onLeadCreated={handleLeadCreated}
        />
      )}
    </>
  )
}