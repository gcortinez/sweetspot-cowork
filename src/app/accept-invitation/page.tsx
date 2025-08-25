import { Metadata } from 'next'

// Force dynamic rendering since this page uses client-side redirect
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Aceptar Invitación - SweetSpot Cowork',
  description: 'Acepta tu invitación y únete a nuestro coworking',
  robots: 'noindex, nofollow',
}

export default function AcceptInvitationPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window !== 'undefined') {
                window.location.href = '/invitation/accept' + window.location.search;
              }
            })();
          `,
        }}
      />
    </main>
  )
}