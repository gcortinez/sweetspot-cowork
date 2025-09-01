'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Users, Building2, Crown, Shield, User, CheckCircle } from 'lucide-react'
// Using API endpoints instead of server actions

interface OnboardingData {
  role?: string
  tenantId?: string
  tenantName?: string
  invitedBy?: string
}

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Administrador',
  COWORK_ADMIN: 'Administrador de Cowork',
  COWORK_USER: 'Usuario de Cowork'
}

const ROLE_ICONS = {
  SUPER_ADMIN: Crown,
  COWORK_ADMIN: Building2,
  COWORK_USER: Users
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({})
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/onboarding/status')
        const data = await response.json()
        
        if (data.success) {
          if (data.onboardingComplete) {
            // User already onboarded, redirect to dashboard
            router.push('/dashboard')
            return
          }
          
          // Set invitation data
          setOnboardingData(data.invitationData || {})
          
          // Pre-fill form with existing data from database or Clerk
          if (data.user) {
            setFirstName(data.user.firstName || '')
            setLastName(data.user.lastName || '')
          } else if (user) {
            // Use Clerk data as fallback
            setFirstName(user.firstName || '')
            setLastName(user.lastName || '')
          }
        } else {
          setError(data.error || 'Failed to load onboarding data')
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setError('Failed to load onboarding data')
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded && user) {
      checkOnboardingStatus()
    }
  }, [isLoaded, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !lastName.trim()) {
      setError('Por favor completa tu nombre y apellido')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined
        })
      })
      
      const data = await response.json()

      if (data.success) {
        // Success! Redirect to dashboard
        router.push('/dashboard')
      } else {
        setError(data.error || 'Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setError('Error al completar la configuración')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const roleIcon = onboardingData.role ? ROLE_ICONS[onboardingData.role as keyof typeof ROLE_ICONS] : User
  const RoleIcon = roleIcon || User

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          ¡Bienvenido a SweetSpot!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Completa tu perfil para comenzar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Invitation Info */}
          {onboardingData.role && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <RoleIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {ROLE_LABELS[onboardingData.role as keyof typeof ROLE_LABELS] || onboardingData.role}
                </span>
              </div>
              
              {onboardingData.tenantName && (
                <div className="flex items-center space-x-2 text-sm text-blue-800">
                  <Building2 className="h-4 w-4" />
                  <span>{onboardingData.tenantName}</span>
                </div>
              )}
              
              {onboardingData.role === 'SUPER_ADMIN' && (
                <div className="flex items-center space-x-2 text-sm text-purple-800 mt-1">
                  <Crown className="h-4 w-4" />
                  <span>Acceso completo a la plataforma</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Onboarding Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Apellido *
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Tu apellido"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="988773344"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !firstName.trim() || !lastName.trim()}
                className="w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Configurando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Completar Configuración</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Al completar tu perfil, aceptas los términos y condiciones de SweetSpot.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}