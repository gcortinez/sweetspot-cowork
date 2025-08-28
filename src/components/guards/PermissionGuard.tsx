'use client'

import React, { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { Permission } from '@/lib/auth/permissions'
import { UserRole } from '@/types/database'
import { AlertCircle, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/clerk-auth-context'

interface PermissionGuardProps {
  children: ReactNode
  
  // Opciones de verificación de permisos
  require?: Permission
  requireAny?: Permission[]
  requireAll?: Permission[]
  
  // Opciones de verificación de rol
  requireRole?: UserRole
  requireAnyRole?: UserRole[]
  
  // Verificación personalizada
  customCheck?: (permissions: ReturnType<typeof usePermissions>) => boolean
  
  // Comportamiento cuando no hay permisos
  fallback?: ReactNode
  hideWhenDenied?: boolean
  redirectTo?: string
  
  // Mostrar estado de carga
  showLoading?: boolean
}

/**
 * Componente para proteger rutas y secciones basado en permisos
 * Verifica permisos del usuario antes de renderizar el contenido
 */
export function PermissionGuard({
  children,
  require,
  requireAny,
  requireAll,
  requireRole,
  requireAnyRole,
  customCheck,
  fallback,
  hideWhenDenied = false,
  redirectTo,
  showLoading = true,
}: PermissionGuardProps) {
  const { isLoading, user } = useAuth()
  const permissions = usePermissions()
  
  // Mostrar loading si está cargando la autenticación
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Verificando permisos...</span>
      </div>
    )
  }
  
  // Si no hay usuario, mostrar fallback
  if (!user) {
    if (hideWhenDenied) return null
    if (redirectTo) {
      window.location.href = redirectTo
      return null
    }
    return fallback || <AccessDeniedFallback message="Debes iniciar sesión para acceder a esta sección" />
  }
  
  let hasAccess = true
  let deniedReason = ''
  
  // Verificar permiso único
  if (require && !permissions.can(require)) {
    hasAccess = false
    deniedReason = `No tienes permisos para: ${require}`
  }
  
  // Verificar cualquier permiso
  if (requireAny && !permissions.canAny(requireAny)) {
    hasAccess = false
    deniedReason = `Necesitas al menos uno de estos permisos: ${requireAny.join(', ')}`
  }
  
  // Verificar todos los permisos
  if (requireAll && !permissions.canAll(requireAll)) {
    hasAccess = false
    deniedReason = `Necesitas todos estos permisos: ${requireAll.join(', ')}`
  }
  
  // Verificar rol específico
  if (requireRole && !permissions.hasRole(requireRole)) {
    hasAccess = false
    deniedReason = `Necesitas el rol: ${requireRole}`
  }
  
  // Verificar cualquier rol
  if (requireAnyRole && !requireAnyRole.some(role => permissions.hasRole(role))) {
    hasAccess = false
    deniedReason = `Necesitas uno de estos roles: ${requireAnyRole.join(', ')}`
  }
  
  // Verificación personalizada
  if (customCheck && !customCheck(permissions)) {
    hasAccess = false
    deniedReason = 'No cumples con los requisitos de acceso'
  }
  
  // Si no tiene acceso
  if (!hasAccess) {
    if (hideWhenDenied) return null
    if (redirectTo) {
      window.location.href = redirectTo
      return null
    }
    return fallback || <AccessDeniedFallback message={deniedReason} userRole={permissions.userRole} />
  }
  
  // Si tiene acceso, renderizar children
  return <>{children}</>
}

/**
 * Componente de fallback cuando el acceso es denegado
 */
function AccessDeniedFallback({ 
  message, 
  userRole 
}: { 
  message: string
  userRole?: UserRole 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
        <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Acceso Restringido
        </h3>
        <p className="text-red-700 mb-4">{message}</p>
        {userRole && (
          <p className="text-sm text-red-600">
            Tu rol actual: <strong>{userRole}</strong>
          </p>
        )}
        <div className="mt-4 p-3 bg-red-100 rounded-md">
          <p className="text-sm text-red-800 flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            Si crees que esto es un error, contacta a tu administrador.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PermissionGuard