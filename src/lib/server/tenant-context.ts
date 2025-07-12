import { UserRole } from '@/types/database'
import { SessionManager } from './sessions'
import { AuthService } from './auth'
import prisma from './prisma'
import { createClient } from '@supabase/supabase-js'

/**
 * Tenant context for multi-tenant operations in Server Actions
 */
export interface TenantContext {
  tenantId: string | null // Allow null for super admins
  userId: string
  role: UserRole
  clientId?: string
}

/**
 * Multi-tenant context manager for Server Actions
 */
export class TenantContextManager {
  /**
   * Get tenant context from current session
   */
  static async getTenantContext(): Promise<TenantContext | null> {
    try {
      const session = await SessionManager.getValidSession()
      
      if (!session || !session.isValid || !session.user) {
        return null
      }

      return {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        role: session.user.role,
        clientId: session.user.clientId,
      }
    } catch (error) {
      console.error('Error getting tenant context:', error)
      return null
    }
  }

  /**
   * Require tenant context - throw error if not available
   */
  static async requireTenantContext(): Promise<TenantContext> {
    const context = await this.getTenantContext()
    
    if (!context) {
      throw new Error('Tenant context required but not available')
    }
    
    return context
  }

  /**
   * Get Prisma client with tenant context for RLS
   */
  static async getTenantPrisma(): Promise<typeof prisma> {
    const context = await this.getTenantContext()
    
    if (!context) {
      throw new Error('Cannot get tenant Prisma client without context')
    }
    
    // For now, return the regular prisma client
    // In the future, we could extend this to set RLS context
    return prisma
  }

  /**
   * Validate that a user has access to a specific tenant
   */
  static validateTenantAccess(
    userContext: TenantContext,
    targetTenantId: string
  ): boolean {
    // Super admins can access any tenant
    if (userContext.role === 'SUPER_ADMIN') {
      return true
    }

    // Other users can only access their own tenant
    return userContext.tenantId === targetTenantId
  }

  /**
   * Require access to specific tenant
   */
  static async requireTenantAccess(tenantId: string): Promise<TenantContext> {
    const context = await this.requireTenantContext()
    
    if (!this.validateTenantAccess(context, tenantId)) {
      throw new Error(`Access denied to tenant: ${tenantId}`)
    }
    
    return context
  }

  /**
   * Get all tenant IDs accessible by current user
   */
  static async getAccessibleTenantIds(): Promise<string[]> {
    const context = await this.getTenantContext()
    
    if (!context) {
      return []
    }

    // Super admins can access all tenants
    if (context.role === 'SUPER_ADMIN') {
      const tenants = await prisma.tenant.findMany({
        select: { id: true },
        where: { status: 'ACTIVE' }
      })
      return tenants.map(t => t.id)
    }

    // Other users can only access their own tenant
    return context.tenantId ? [context.tenantId] : []
  }

  /**
   * Switch tenant context (for multi-tenant users)
   */
  static async switchTenant(tenantId: string): Promise<void> {
    const context = await this.requireTenantContext()
    
    // Verify user has access to the target tenant
    if (!this.validateTenantAccess(context, tenantId)) {
      throw new Error(`Cannot switch to tenant: ${tenantId}`)
    }
    
    await SessionManager.switchTenant(tenantId)
  }
}

/**
 * Permission checking utilities
 */

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'COWORK_ADMIN'].includes(role)
}

/**
 * Check if user can manage clients
 */
export function canManageClients(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'COWORK_ADMIN'].includes(role)
}

/**
 * Check if user can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'COWORK_ADMIN'].includes(role)
}

/**
 * Check if user can view financial data
 */
export function canViewFinancials(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'COWORK_ADMIN', 'CLIENT_ADMIN'].includes(role)
}

/**
 * Check if user can make bookings
 */
export function canMakeBookings(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'COWORK_ADMIN', 'CLIENT_ADMIN', 'END_USER'].includes(role)
}

/**
 * Check role hierarchy - if user role meets minimum required level
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    END_USER: 1,
    CLIENT_ADMIN: 2,
    COWORK_ADMIN: 3,
    SUPER_ADMIN: 4,
  }
  
  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = roleHierarchy[minimumRole] || 999
  
  return userLevel >= requiredLevel
}

/**
 * Helper functions for common tenant operations
 */

/**
 * Execute operation with tenant context
 */
export async function withTenantContext<T>(
  operation: (context: TenantContext) => Promise<T>
): Promise<T> {
  const context = await TenantContextManager.requireTenantContext()
  return operation(context)
}

/**
 * Execute operation requiring specific role
 */
export async function withRole<T>(
  minimumRole: UserRole,
  operation: (context: TenantContext) => Promise<T>
): Promise<T> {
  const context = await TenantContextManager.requireTenantContext()
  
  if (!hasMinimumRole(context.role, minimumRole)) {
    throw new Error(`Insufficient permissions. Required: ${minimumRole}, Current: ${context.role}`)
  }
  
  return operation(context)
}

/**
 * Execute operation requiring access to specific tenant
 */
export async function withTenantAccess<T>(
  tenantId: string,
  operation: (context: TenantContext) => Promise<T>
): Promise<T> {
  const context = await TenantContextManager.requireTenantAccess(tenantId)
  return operation(context)
}

/**
 * Get current tenant ID
 */
export async function getCurrentTenantId(): Promise<string | null> {
  const context = await TenantContextManager.getTenantContext()
  return context?.tenantId || null
}

/**
 * Get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const context = await TenantContextManager.getTenantContext()
  return context?.userId || null
}

/**
 * Get current user role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const context = await TenantContextManager.getTenantContext()
  return context?.role || null
}

/**
 * Check if current user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === 'SUPER_ADMIN'
}

/**
 * Require super admin access
 */
export async function requireSuperAdmin(): Promise<TenantContext> {
  const context = await TenantContextManager.requireTenantContext()
  
  if (context.role !== 'SUPER_ADMIN') {
    throw new Error('Super admin access required')
  }
  
  return context
}

/**
 * Require admin access (SUPER_ADMIN or COWORK_ADMIN)
 */
export async function requireAdmin(): Promise<TenantContext> {
  const context = await TenantContextManager.requireTenantContext()
  
  if (!isAdmin(context.role)) {
    throw new Error('Admin access required')
  }
  
  return context
}

/**
 * Get Prisma client with tenant context
 */
export async function getTenantPrisma(): Promise<typeof prisma> {
  return TenantContextManager.getTenantPrisma()
}