/**
 * Sistema centralizado de permisos RBAC para SweetSpot Cowork
 * Define recursos, permisos y mapeo de roles
 */

import { UserRole } from '@/types/database'

/**
 * Recursos y acciones disponibles en el sistema
 */
export enum Resource {
  // Dashboard
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_PLATFORM = 'dashboard:platform',
  
  // Estadísticas
  STATS_GLOBAL = 'stats:global',
  STATS_COWORK = 'stats:cowork',
  
  // Coworks
  COWORK_VIEW = 'cowork:view',
  COWORK_CREATE = 'cowork:create',
  COWORK_EDIT = 'cowork:edit',
  COWORK_DELETE = 'cowork:delete',
  
  // Usuarios - Cowork level
  USER_VIEW = 'user:view',
  USER_INVITE = 'user:invite',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  
  // Usuarios - Platform level (Super Admin only)
  PLATFORM_USER_VIEW = 'platform:user:view',
  PLATFORM_USER_MANAGE = 'platform:user:manage',
  
  // Servicios
  SERVICE_VIEW = 'service:view',
  SERVICE_CREATE = 'service:create',
  SERVICE_EDIT = 'service:edit',
  SERVICE_DELETE = 'service:delete',
  
  // Prospectos
  PROSPECT_VIEW = 'prospect:view',
  PROSPECT_CREATE = 'prospect:create',
  PROSPECT_EDIT = 'prospect:edit',
  PROSPECT_DELETE = 'prospect:delete',
  
  // Oportunidades
  OPPORTUNITY_VIEW = 'opportunity:view',
  OPPORTUNITY_CREATE = 'opportunity:create',
  OPPORTUNITY_EDIT = 'opportunity:edit',
  OPPORTUNITY_DELETE = 'opportunity:delete',
  
  // Clientes
  CLIENT_VIEW = 'client:view',
  CLIENT_CREATE = 'client:create',
  CLIENT_EDIT = 'client:edit',
  CLIENT_DELETE = 'client:delete',
  
  // Cotizaciones
  QUOTATION_VIEW = 'quotation:view',
  QUOTATION_CREATE = 'quotation:create',
  QUOTATION_EDIT = 'quotation:edit',
  QUOTATION_DELETE = 'quotation:delete',
  
  // Espacios
  SPACE_VIEW = 'space:view',
  SPACE_CREATE = 'space:create',
  SPACE_EDIT = 'space:edit',
  SPACE_DELETE = 'space:delete',
}

/**
 * Tipo para representar un permiso
 */
export type Permission = Resource

/**
 * Mapeo de roles a sus permisos correspondientes
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Super Admin tiene TODOS los permisos
    ...Object.values(Resource)
  ],
  
  COWORK_ADMIN: [
    // Dashboard y estadísticas
    Resource.DASHBOARD_VIEW,
    Resource.STATS_COWORK,
    
    // Gestión completa de usuarios (sin crear coworks)
    Resource.USER_VIEW,
    Resource.USER_INVITE,
    Resource.USER_CREATE,
    Resource.USER_EDIT,
    Resource.USER_DELETE,
    
    // Gestión completa de servicios
    Resource.SERVICE_VIEW,
    Resource.SERVICE_CREATE,
    Resource.SERVICE_EDIT,
    Resource.SERVICE_DELETE,
    
    // Gestión completa del CRM
    Resource.PROSPECT_VIEW,
    Resource.PROSPECT_CREATE,
    Resource.PROSPECT_EDIT,
    Resource.PROSPECT_DELETE,
    Resource.OPPORTUNITY_VIEW,
    Resource.OPPORTUNITY_CREATE,
    Resource.OPPORTUNITY_EDIT,
    Resource.OPPORTUNITY_DELETE,
    Resource.CLIENT_VIEW,
    Resource.CLIENT_CREATE,
    Resource.CLIENT_EDIT,
    Resource.CLIENT_DELETE,
    Resource.QUOTATION_VIEW,
    Resource.QUOTATION_CREATE,
    Resource.QUOTATION_EDIT,
    Resource.QUOTATION_DELETE,
    
    // Gestión de espacios
    Resource.SPACE_VIEW,
    Resource.SPACE_CREATE,
    Resource.SPACE_EDIT,
    Resource.SPACE_DELETE,
  ],
  
  COWORK_USER: [
    // Dashboard básico
    Resource.DASHBOARD_VIEW,
    
    // Solo lectura de usuarios
    Resource.USER_VIEW,
    
    // Solo lectura de servicios
    Resource.SERVICE_VIEW,
    
    // CRM con permisos limitados (sin eliminar)
    Resource.PROSPECT_VIEW,
    Resource.PROSPECT_CREATE,
    Resource.PROSPECT_EDIT,
    Resource.OPPORTUNITY_VIEW,
    Resource.OPPORTUNITY_CREATE,
    Resource.OPPORTUNITY_EDIT,
    Resource.CLIENT_VIEW,
    Resource.CLIENT_CREATE,
    Resource.CLIENT_EDIT,
    Resource.QUOTATION_VIEW,
    Resource.QUOTATION_CREATE,
    Resource.QUOTATION_EDIT,
    
    // Solo ver espacios
    Resource.SPACE_VIEW,
  ],
  
  // Roles de cliente (para futura implementación)
  CLIENT_ADMIN: [
    Resource.DASHBOARD_VIEW,
  ],
  
  END_USER: [
    Resource.DASHBOARD_VIEW,
  ],
}

/**
 * Jerarquía de roles (mayor número = más permisos)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  END_USER: 1,
  CLIENT_ADMIN: 2,
  COWORK_USER: 3,
  COWORK_ADMIN: 4,
  SUPER_ADMIN: 5,
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

/**
 * Verifica si un rol tiene alguno de los permisos especificados
 */
export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role || permissions.length === 0) return false
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Verifica si un rol tiene todos los permisos especificados
 */
export function hasAllPermissions(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role || permissions.length === 0) return false
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getRolePermissions(role: UserRole | undefined): Permission[] {
  if (!role) return []
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Verifica si un rol puede realizar una acción CRUD en un recurso
 */
export function canPerformAction(
  role: UserRole | undefined,
  action: 'view' | 'create' | 'edit' | 'delete',
  resource: 'service' | 'user' | 'prospect' | 'opportunity' | 'client' | 'quotation' | 'space' | 'cowork'
): boolean {
  if (!role) return false
  
  const permissionMap: Record<string, Permission> = {
    // Servicios
    'service:view': Resource.SERVICE_VIEW,
    'service:create': Resource.SERVICE_CREATE,
    'service:edit': Resource.SERVICE_EDIT,
    'service:delete': Resource.SERVICE_DELETE,
    
    // Usuarios
    'user:view': Resource.USER_VIEW,
    'user:create': Resource.USER_CREATE,
    'user:edit': Resource.USER_EDIT,
    'user:delete': Resource.USER_DELETE,
    
    // Prospectos
    'prospect:view': Resource.PROSPECT_VIEW,
    'prospect:create': Resource.PROSPECT_CREATE,
    'prospect:edit': Resource.PROSPECT_EDIT,
    'prospect:delete': Resource.PROSPECT_DELETE,
    
    // Oportunidades
    'opportunity:view': Resource.OPPORTUNITY_VIEW,
    'opportunity:create': Resource.OPPORTUNITY_CREATE,
    'opportunity:edit': Resource.OPPORTUNITY_EDIT,
    'opportunity:delete': Resource.OPPORTUNITY_DELETE,
    
    // Clientes
    'client:view': Resource.CLIENT_VIEW,
    'client:create': Resource.CLIENT_CREATE,
    'client:edit': Resource.CLIENT_EDIT,
    'client:delete': Resource.CLIENT_DELETE,
    
    // Cotizaciones
    'quotation:view': Resource.QUOTATION_VIEW,
    'quotation:create': Resource.QUOTATION_CREATE,
    'quotation:edit': Resource.QUOTATION_EDIT,
    'quotation:delete': Resource.QUOTATION_DELETE,
    
    // Espacios
    'space:view': Resource.SPACE_VIEW,
    'space:create': Resource.SPACE_CREATE,
    'space:edit': Resource.SPACE_EDIT,
    'space:delete': Resource.SPACE_DELETE,
    
    // Coworks
    'cowork:view': Resource.COWORK_VIEW,
    'cowork:create': Resource.COWORK_CREATE,
    'cowork:edit': Resource.COWORK_EDIT,
    'cowork:delete': Resource.COWORK_DELETE,
  }
  
  const permissionKey = `${resource}:${action}`
  const permission = permissionMap[permissionKey]
  
  return permission ? hasPermission(role, permission) : false
}

/**
 * Obtiene los elementos de navegación visibles para un rol
 */
export function getVisibleNavItems(role: UserRole | undefined): string[] {
  if (!role) return []
  
  const visibleItems: string[] = ['dashboard'] // Dashboard siempre visible
  
  // Prospectos
  if (hasPermission(role, Resource.PROSPECT_VIEW)) {
    visibleItems.push('leads')
  }
  
  // Oportunidades
  if (hasPermission(role, Resource.OPPORTUNITY_VIEW)) {
    visibleItems.push('opportunities')
  }
  
  // Clientes
  if (hasPermission(role, Resource.CLIENT_VIEW)) {
    visibleItems.push('clients')
  }
  
  // Cotizaciones
  if (hasPermission(role, Resource.QUOTATION_VIEW)) {
    visibleItems.push('quotations')
  }
  
  // Servicios
  if (hasPermission(role, Resource.SERVICE_VIEW)) {
    visibleItems.push('services')
  }
  
  // Espacios
  if (hasPermission(role, Resource.SPACE_VIEW)) {
    visibleItems.push('spaces')
  }
  
  // Usuarios (solo para admins)
  if (hasPermission(role, Resource.USER_EDIT)) {
    visibleItems.push('users')
  }
  
  // Estadísticas
  if (hasPermission(role, Resource.STATS_COWORK) || hasPermission(role, Resource.STATS_GLOBAL)) {
    visibleItems.push('reports')
  }
  
  return visibleItems
}

/**
 * Verifica si un rol es superior a otro en la jerarquía
 */
export function isRoleHigherThan(role1: UserRole | undefined, role2: UserRole | undefined): boolean {
  if (!role1 || !role2) return false
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2]
}

/**
 * Verifica si un rol es igual o superior a otro
 */
export function isRoleEqualOrHigherThan(role1: UserRole | undefined, role2: UserRole | undefined): boolean {
  if (!role1 || !role2) return false
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2]
}