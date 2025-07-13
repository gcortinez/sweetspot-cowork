'use client'

import { useEffect } from 'react'
import { useClerk } from '@clerk/nextjs'
import { XCircle, LogOut } from 'lucide-react'

export default function SuspendedPage() {
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' })
  }

  return (
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
          Tu cuenta ha sido suspendida temporalmente
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Tu cuenta ha sido suspendida por un administrador. 
                No puedes acceder al sistema en este momento.
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Si crees que esto es un error, por favor contacta con el administrador del sistema.
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