import { Metadata } from 'next'
import { Suspense } from 'react'
import InvitationAcceptClient from './client'

// Force dynamic rendering since this page uses Clerk authentication
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Aceptar Invitación - SweetSpot Cowork',
  description: 'Acepta tu invitación y únete a nuestro coworking',
  robots: 'noindex, nofollow',
}

export default function InvitationAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <InvitationAcceptClient />
    </Suspense>
  )
}