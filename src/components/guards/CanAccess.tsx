'use client'

import React, { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { Permission } from '@/lib/auth/permissions'
import { UserRole } from '@/types/database'

interface CanAccessProps {
  children: ReactNode
  
  // Opciones de verificación
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean // Si true, requiere todos los permisos. Si false, requiere al menos uno
  role?: UserRole
  roles?: UserRole[]
  
  // Verificación personalizada
  customCheck?: (permissions: ReturnType<typeof usePermissions>) => boolean
  
  // Comportamiento cuando no hay acceso
  fallback?: ReactNode
  hideWhenDenied?: boolean
  
  // Props adicionales para debugging
  debug?: boolean
}

/**
 * Componente simple para renderizado condicional basado en permisos
 * Útil para mostrar/ocultar elementos UI como botones, enlaces, etc.
 */
export function CanAccess({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  customCheck,
  fallback = null,
  hideWhenDenied = true,
  debug = false,
}: CanAccessProps) {
  const perms = usePermissions()
  
  let hasAccess = true
  
  // Verificar permiso único
  if (permission) {
    hasAccess = perms.can(permission)
    if (debug) console.log(`CanAccess: Checking permission ${permission}:`, hasAccess)
  }
  
  // Verificar múltiples permisos
  if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? perms.canAll(permissions)
      : perms.canAny(permissions)
    if (debug) console.log(`CanAccess: Checking permissions ${permissions.join(', ')} (requireAll: ${requireAll}):`, hasAccess)
  }
  
  // Verificar rol único
  if (role) {
    hasAccess = hasAccess && perms.hasRole(role)
    if (debug) console.log(`CanAccess: Checking role ${role}:`, perms.hasRole(role))
  }
  
  // Verificar múltiples roles
  if (roles && roles.length > 0) {
    const hasAnyRole = roles.some(r => perms.hasRole(r))
    hasAccess = hasAccess && hasAnyRole
    if (debug) console.log(`CanAccess: Checking roles ${roles.join(', ')}:`, hasAnyRole)
  }
  
  // Verificación personalizada
  if (customCheck) {
    const customResult = customCheck(perms)
    hasAccess = hasAccess && customResult
    if (debug) console.log(`CanAccess: Custom check result:`, customResult)
  }
  
  // Si no tiene acceso
  if (!hasAccess) {
    if (hideWhenDenied) return null
    return <>{fallback}</>
  }
  
  // Si tiene acceso, renderizar children
  return <>{children}</>
}

/**
 * Componente inverso - muestra contenido cuando NO se tiene permiso
 */
export function CannotAccess({
  children,
  permission,
  fallback = null,
}: {
  children: ReactNode
  permission?: Permission
  fallback?: ReactNode
}) {
  const perms = usePermissions()
  
  if (permission && perms.can(permission)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Componente para mostrar contenido solo a Super Admins
 */
export function SuperAdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <CanAccess role="SUPER_ADMIN" fallback={fallback}>
      {children}
    </CanAccess>
  )
}

/**
 * Componente para mostrar contenido solo a Cowork Admins
 */
export function CoworkAdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <CanAccess roles={['COWORK_ADMIN', 'SUPER_ADMIN']} fallback={fallback}>
      {children}
    </CanAccess>
  )
}

/**
 * Componente para mostrar contenido a usuarios del cowork (admin o user)
 */
export function CoworkStaffOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <CanAccess roles={['COWORK_USER', 'COWORK_ADMIN', 'SUPER_ADMIN']} fallback={fallback}>
      {children}
    </CanAccess>
  )
}

export default CanAccess