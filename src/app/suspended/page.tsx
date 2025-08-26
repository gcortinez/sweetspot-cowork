'use client'

import { useEffect, useState, Suspense } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { XCircle, LogOut, Building2 } from 'lucide-react'

function SuspendedContent() {
  const { signOut } = useClerk()
  const searchParams = useSearchParams()
  const [suspensionInfo, setSuspensionInfo] = useState({
    reason: '',
    tenantStatus: ''
  })

  useEffect(() => {
    setSuspensionInfo({
      reason: searchParams.get('reason') ? decodeURIComponent(searchParams.get('reason')!) : '',
      tenantStatus: searchParams.get('tenantStatus') || ''
    })
  }, [searchParams])

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' })
  }

  const isCoworkSuspended = suspensionInfo.tenantStatus === 'SUSPENDED' || suspensionInfo.tenantStatus === 'INACTIVE'

  return (
    <div className="min-h-screen bg-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-red-100 p-3 rounded-full">
            {isCoworkSuspended ? (
              <Building2 className="h-8 w-8 text-red-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {isCoworkSuspended ? 'Cowork Suspendido' : 'Cuenta Suspendida'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isCoworkSuspended 
            ? 'Tu espacio de coworking ha sido suspendido temporalmente'
            : 'Tu cuenta ha sido suspendida temporalmente'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                {suspensionInfo.reason || (isCoworkSuspended 
                  ? 'Tu espacio de coworking ha sido suspendido por un administrador.'
                  : 'Tu cuenta ha sido suspendida por un administrador.'
                )}
                {' '}No puedes acceder al sistema en este momento.
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {isCoworkSuspended 
                  ? 'Si crees que esto es un error, por favor contacta con el administrador de tu cowork o con el soporte de SweetSpot.'
                  : 'Si crees que esto es un error, por favor contacta con el administrador del sistema.'
                }
              </p>
              
              <button
                onClick={handleSignOut}
                className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Cuenta Suspendida
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Cargando información de suspensión...
          </p>
        </div>
      </div>
    }>
      <SuspendedContent />
    </Suspense>
  )
}