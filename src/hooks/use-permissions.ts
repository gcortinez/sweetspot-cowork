'use client'

import { useMemo } from 'react'
import { useAuth } from '@/contexts/clerk-auth-context'
import {
  Resource,
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canPerformAction,
  getVisibleNavItems,
  isRoleHigherThan,
  isRoleEqualOrHigherThan,
} from '@/lib/auth/permissions'

/**
 * Hook principal para gestión de permisos
 * Provee funciones helper para verificar permisos en componentes
 */
export function usePermissions() {
  const { user } = useAuth()
  const userRole = user?.role
  
  return useMemo(() => {
    // Funciones de verificación de permisos
    const can = (permission: Permission): boolean => {
      return hasPermission(userRole, permission)
    }
    
    const cannot = (permission: Permission): boolean => {
      return !hasPermission(userRole, permission)
    }
    
    const canAny = (permissions: Permission[]): boolean => {
      return hasAnyPermission(userRole, permissions)
    }
    
    const canAll = (permissions: Permission[]): boolean => {
      return hasAllPermissions(userRole, permissions)
    }
    
    // Funciones de verificación de acciones CRUD
    const canView = (resource: 'service' | 'user' | 'prospect' | 'opportunity' | 'client' | 'quotation' | 'space' | 'cowork'): boolean => {
      return canPerformAction(userRole, 'view', resource)
    }
    
    const canCreate = (resource: 'service' | 'user' | 'prospect' | 'opportunity' | 'client' | 'quotation' | 'space' | 'cowork'): boolean => {
      return canPerformAction(userRole, 'create', resource)
    }
    
    const canEdit = (resource: 'service' | 'user' | 'prospect' | 'opportunity' | 'client' | 'quotation' | 'space' | 'cowork'): boolean => {
      return canPerformAction(userRole, 'edit', resource)
    }
    
    const canDelete = (resource: 'service' | 'user' | 'prospect' | 'opportunity' | 'client' | 'quotation' | 'space' | 'cowork'): boolean => {
      return canPerformAction(userRole, 'delete', resource)
    }
    
    // Obtener todos los permisos del usuario
    const permissions = getRolePermissions(userRole)
    
    // Obtener elementos de navegación visibles
    const visibleNavItems = getVisibleNavItems(userRole)
    
    // Verificaciones de rol
    const hasRole = (role: typeof userRole): boolean => {
      return userRole === role
    }
    
    const isHigherThan = (role: typeof userRole): boolean => {
      return isRoleHigherThan(userRole, role)
    }
    
    const isEqualOrHigherThan = (role: typeof userRole): boolean => {
      return isRoleEqualOrHigherThan(userRole, role)
    }
    
    // Helpers específicos por rol
    const isSuperAdmin = userRole === 'SUPER_ADMIN'
    const isCoworkAdmin = userRole === 'COWORK_ADMIN'
    const isCoworkUser = userRole === 'COWORK_USER'
    const isClientAdmin = userRole === 'CLIENT_ADMIN'
    const isEndUser = userRole === 'END_USER'
    
    // Helpers para verificaciones comunes
    const canManageServices = can(Resource.SERVICE_CREATE) || can(Resource.SERVICE_EDIT) || can(Resource.SERVICE_DELETE)
    const canManageUsers = can(Resource.USER_CREATE) || can(Resource.USER_EDIT) || can(Resource.USER_DELETE)
    const canManageCoworks = can(Resource.COWORK_CREATE) || can(Resource.COWORK_EDIT) || can(Resource.COWORK_DELETE)
    const canViewStats = can(Resource.STATS_COWORK) || can(Resource.STATS_GLOBAL)
    const canInviteUsers = can(Resource.USER_INVITE)
    
    return {
      // Funciones principales
      can,
      cannot,
      canAny,
      canAll,
      
      // Funciones CRUD
      canView,
      canCreate,
      canEdit,
      canDelete,
      
      // Datos del usuario
      userRole,
      permissions,
      visibleNavItems,
      
      // Verificaciones de rol
      hasRole,
      isHigherThan,
      isEqualOrHigherThan,
      
      // Helpers de rol
      isSuperAdmin,
      isCoworkAdmin,
      isCoworkUser,
      isClientAdmin,
      isEndUser,
      
      // Helpers comunes
      canManageServices,
      canManageUsers,
      canManageCoworks,
      canViewStats,
      canInviteUsers,
    }
  }, [userRole])
}

/**
 * Hook específico para permisos de servicios
 */
export function useServicePermissions() {
  const permissions = usePermissions()
  
  return useMemo(() => ({
    canView: permissions.can(Resource.SERVICE_VIEW),
    canCreate: permissions.can(Resource.SERVICE_CREATE),
    canEdit: permissions.can(Resource.SERVICE_EDIT),
    canDelete: permissions.can(Resource.SERVICE_DELETE),
    isReadOnly: permissions.can(Resource.SERVICE_VIEW) && permissions.cannot(Resource.SERVICE_EDIT),
  }), [permissions])
}

/**
 * Hook específico para permisos de usuarios
 */
export function useUserPermissions() {
  const permissions = usePermissions()
  
  return useMemo(() => ({
    canView: permissions.can(Resource.USER_VIEW),
    canInvite: permissions.can(Resource.USER_INVITE),
    canCreate: permissions.can(Resource.USER_CREATE),
    canEdit: permissions.can(Resource.USER_EDIT),
    canDelete: permissions.can(Resource.USER_DELETE),
    canManage: permissions.canManageUsers,
  }), [permissions])
}

/**
 * Hook específico para permisos del CRM
 */
export function useCRMPermissions() {
  const permissions = usePermissions()
  
  return useMemo(() => ({
    // Prospectos
    prospects: {
      canView: permissions.can(Resource.PROSPECT_VIEW),
      canCreate: permissions.can(Resource.PROSPECT_CREATE),
      canEdit: permissions.can(Resource.PROSPECT_EDIT),
      canDelete: permissions.can(Resource.PROSPECT_DELETE),
    },
    // Oportunidades
    opportunities: {
      canView: permissions.can(Resource.OPPORTUNITY_VIEW),
      canCreate: permissions.can(Resource.OPPORTUNITY_CREATE),
      canEdit: permissions.can(Resource.OPPORTUNITY_EDIT),
      canDelete: permissions.can(Resource.OPPORTUNITY_DELETE),
    },
    // Clientes
    clients: {
      canView: permissions.can(Resource.CLIENT_VIEW),
      canCreate: permissions.can(Resource.CLIENT_CREATE),
      canEdit: permissions.can(Resource.CLIENT_EDIT),
      canDelete: permissions.can(Resource.CLIENT_DELETE),
    },
    // Cotizaciones
    quotations: {
      canView: permissions.can(Resource.QUOTATION_VIEW),
      canCreate: permissions.can(Resource.QUOTATION_CREATE),
      canEdit: permissions.can(Resource.QUOTATION_EDIT),
      canDelete: permissions.can(Resource.QUOTATION_DELETE),
    },
  }), [permissions])
}

/**
 * Hook para permisos de navegación
 */
export function useNavigationPermissions() {
  const permissions = usePermissions()

  return useMemo(() => ({
    visibleItems: permissions.visibleNavItems,
    showDashboard: permissions.visibleNavItems.includes('dashboard'),
    showLeads: permissions.visibleNavItems.includes('leads'),
    showOpportunities: permissions.visibleNavItems.includes('opportunities'),
    showClients: permissions.visibleNavItems.includes('clients'),
    showQuotations: permissions.visibleNavItems.includes('quotations'),
    showServices: permissions.visibleNavItems.includes('services'),
    showSpaces: permissions.visibleNavItems.includes('spaces'),
    showSpaceAdmin: permissions.can(Resource.SPACE_EDIT), // Admin can manage space types
    showUsers: permissions.visibleNavItems.includes('users'),
    showReports: permissions.visibleNavItems.includes('reports'),
  }), [permissions.visibleNavItems, permissions])
}

/**
 * Hook para permisos de dashboard
 */
export function useDashboardPermissions() {
  const permissions = usePermissions()
  
  return useMemo(() => ({
    canViewDashboard: permissions.can(Resource.DASHBOARD_VIEW),
    canViewPlatformDashboard: permissions.can(Resource.DASHBOARD_PLATFORM),
    canViewGlobalStats: permissions.can(Resource.STATS_GLOBAL),
    canViewCoworkStats: permissions.can(Resource.STATS_COWORK),
    showPlatformView: permissions.isSuperAdmin,
    showCoworkStats: permissions.isCoworkAdmin || permissions.isSuperAdmin,
  }), [permissions])
}