'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSignUp, useSignIn } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { ClerkAPIError } from '@clerk/types'
import { Loader2, Users, CheckCircle, XCircle, UserPlus, LogIn, RefreshCw, ArrowLeft, Eye, EyeOff } from 'lucide-react'

type InvitationState = 'loading' | 'new_user_form' | 'existing_user_form' | 'processing' | 'success' | 'error'

export default function InvitationAcceptClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp()
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn()

  const [state, setState] = useState<InvitationState>('loading')
  const [errors, setErrors] = useState<ClerkAPIError[]>([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const ticket = searchParams.get('__clerk_ticket')
  const status = searchParams.get('__clerk_status')
  const isNewUser = status === 'sign_up' || !status

  useEffect(() => {
    // Basic validation
    if (!ticket) {
      router.push('/sign-in?error=invalid_invitation')
      return
    }

    if (!ticket.includes('.') || ticket.split('.').length !== 3) {
      router.push('/sign-in?error=malformed_invitation')
      return
    }

    // Wait for Clerk to load
    if (!signUpLoaded || !signInLoaded) return

    // Determine the flow
    if (status === 'sign_in') {
      setState('existing_user_form')
    } else {
      setState('new_user_form')
    }
  }, [ticket, status, signUpLoaded, signInLoaded, router])

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.firstName.trim()) {
      errors.push('El nombre es requerido')
    }

    if (!formData.lastName.trim()) {
      errors.push('El apellido es requerido')
    }

    if (formData.password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres')
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push('Las contraseñas no coinciden')
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      errors.push('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial')
    }

    // Check for common patterns to avoid compromised passwords
    const commonPatterns = [
      /^.*(123|abc|password|admin|user|guest).*$/i,
      /^(.)\1{3,}/, // repeated characters
      /^(012|234|345|456|567|678|789)/, // sequential numbers
    ]

    if (commonPatterns.some(pattern => pattern.test(formData.password))) {
      errors.push('La contraseña no puede contener patrones comunes o secuencias predecibles')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !signUp || !ticket) return

    try {
      setState('processing')
      setErrors([])

      const result = await signUp.create({
        strategy: 'ticket',
        ticket,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password,
      })

      if (result.status === 'complete') {
        if (setActiveSignUp) {
          await setActiveSignUp({ session: result.createdSessionId })
        }
        setState('success')
        
        setTimeout(() => {
          router.push('/onboarding')
        }, 2000)
      } else {
        setState('error')
        setErrors([{
          code: 'signup_incomplete',
          message: 'El proceso de registro no se completó',
          longMessage: 'Por favor intenta nuevamente o contacta al administrador'
        } as ClerkAPIError])
      }
    } catch (error) {
      setState('error')
      if (isClerkAPIResponseError(error)) {
        setErrors(error.errors)
      } else {
        setErrors([{
          code: 'unknown_error',
          message: 'Error inesperado',
          longMessage: 'Ocurrió un error inesperado. Por favor intenta nuevamente.'
        } as ClerkAPIError])
      }
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signIn || !ticket) return

    try {
      setState('processing')
      setErrors([])

      const result = await signIn.create({
        strategy: 'ticket',
        ticket,
      })

      if (result.status === 'complete') {
        if (setActiveSignIn) {
          await setActiveSignIn({ session: result.createdSessionId })
        }
        setState('success')
        
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setState('error')
        setErrors([{
          code: 'signin_incomplete',
          message: 'El proceso de autenticación no se completó',
          longMessage: 'Por favor intenta nuevamente o contacta al administrador'
        } as ClerkAPIError])
      }
    } catch (error) {
      setState('error')
      if (isClerkAPIResponseError(error)) {
        setErrors(error.errors)
      } else {
        setErrors([{
          code: 'unknown_error',
          message: 'Error inesperado',
          longMessage: 'Ocurrió un error inesperado. Por favor intenta nuevamente.'
        } as ClerkAPIError])
      }
    }
  }

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Cargando...
            </h3>
            <p className="text-sm text-gray-600">
              Por favor espera mientras verificamos tu invitación
            </p>
          </div>
        )

      case 'new_user_form':
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Completa tu perfil
            </h2>
            <form onSubmit={handleSignUp} className="space-y-6">
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
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
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña *
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Mínimo 8 caracteres, incluye mayúscula, minúscula, número y carácter especial
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Contraseña *
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Crear cuenta y unirse
              </button>
            </form>
          </>
        )

      case 'existing_user_form':
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ¡Bienvenido de vuelta!
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                Ya tienes una cuenta con nosotros. Haz clic en el botón de abajo para acceder 
                automáticamente y aceptar la invitación.
              </p>
            </div>
            <form onSubmit={handleSignIn}>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Acceder y aceptar invitación
              </button>
            </form>
          </>
        )

      case 'processing':
        return (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Procesando tu invitación
            </h3>
            <p className="text-sm text-gray-600">
              {isNewUser ? 'Creando tu cuenta...' : 'Procesando tu acceso...'}
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ¡Invitación aceptada!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isNewUser 
                ? 'Tu cuenta ha sido creada exitosamente' 
                : 'Has accedido exitosamente'
              }
            </p>
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                {isNewUser 
                  ? 'Redirigiendo al proceso de configuración...' 
                  : 'Redirigiendo al dashboard...'
                }
              </p>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error al procesar invitación
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              {errors.map((error, index) => (
                <div key={index}>
                  <p className="text-sm font-medium text-red-800">
                    {error.message}
                  </p>
                  {error.longMessage && (
                    <p className="text-xs text-red-800 opacity-80 mt-1">
                      {error.longMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setState(isNewUser ? 'new_user_form' : 'existing_user_form')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar nuevamente
              </button>
              <button
                onClick={() => router.push('/sign-in')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir al Login
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Users className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          SweetSpot Cowork
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div id="clerk-captcha" className="sr-only"></div>
          
          {renderContent()}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          ¿Necesitas ayuda? Contacta a tu administrador
        </p>
      </div>
    </div>
  )
}