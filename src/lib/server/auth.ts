import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'
import { UserRole } from '@/types/auth'

export interface ServerAuthUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  tenantId: string | null
  clientId: string | null
  isOnboarded: boolean
  clerkId: string
}

/**
 * Get current user with role from database (server-side only)
 * This is the secure way to get user role information
 */
export async function getCurrentUser(): Promise<ServerAuthUser | null> {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return null
    }
    
    // Get user from database using Clerk ID
    const dbUser = await prisma.user.findFirst({
      where: { clerkId: clerkUser.id }
    })
    
    if (!dbUser) {
      // User exists in Clerk but not in database
      // This might happen during registration flow
      return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        role: 'END_USER' as UserRole,
        tenantId: null,
        clientId: null,
        isOnboarded: false,
        clerkId: clerkUser.id
      }
    }
    
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role as UserRole,
      tenantId: dbUser.tenantId,
      clientId: dbUser.clientId,
      isOnboarded: Boolean(dbUser.status === 'ACTIVE'),
      clerkId: dbUser.clerkId || clerkUser.id
    }
    
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if current user is Super Admin
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'SUPER_ADMIN' && user?.tenantId === null
}

/**
 * Check if current user has access to tenant
 */
export async function canAccessTenant(tenantId: string): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) return false
  
  // Super Admins can access any tenant
  if (user.role === 'SUPER_ADMIN' && user.tenantId === null) {
    return true
  }
  
  // Users can only access their own tenant
  return user.tenantId === tenantId
}

/**
 * Require specific role or throw error
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<ServerAuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }
  
  return user
}

// Legacy AuthService for backward compatibility
export class AuthService {
  static async login() {
    throw new Error('Use Clerk for authentication')
  }
  
  static async register() {
    throw new Error('Use Clerk for authentication')
  }
  
  static async refreshToken() {
    throw new Error('Use Clerk for authentication')
  }
  
  static async getSession() {
    return getCurrentUser()
  }
}