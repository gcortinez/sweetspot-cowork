import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthService, type AuthUser, type SessionInfo } from './auth'

// Session configuration
const SESSION_CONFIG = {
  // Cookie names
  ACCESS_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
  TENANT_ID: 'tenant-id',
  
  // Cookie options
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  
  // Expiration times
  ACCESS_TOKEN_EXPIRES: 60 * 60, // 1 hour in seconds
  REFRESH_TOKEN_EXPIRES: 7 * 24 * 60 * 60, // 7 days in seconds
} as const

/**
 * Session Management for Server Actions
 * Handles HTTP-only cookies for secure authentication
 */
export class SessionManager {
  /**
   * Set session cookies after successful login
   */
  static async setSession(
    accessToken: string,
    refreshToken: string,
    tenantId?: string,
    expiresAt?: string
  ): Promise<void> {
    const cookieStore = await cookies()
    
    const expiresDate = expiresAt 
      ? new Date(expiresAt)
      : new Date(Date.now() + SESSION_CONFIG.ACCESS_TOKEN_EXPIRES * 1000)
    
    const refreshExpiresDate = new Date(Date.now() + SESSION_CONFIG.REFRESH_TOKEN_EXPIRES * 1000)

    // Set access token cookie
    cookieStore.set(SESSION_CONFIG.ACCESS_TOKEN, accessToken, {
      httpOnly: SESSION_CONFIG.httpOnly,
      secure: SESSION_CONFIG.secure,
      sameSite: SESSION_CONFIG.sameSite,
      path: SESSION_CONFIG.path,
      expires: expiresDate,
    })

    // Set refresh token cookie
    cookieStore.set(SESSION_CONFIG.REFRESH_TOKEN, refreshToken, {
      httpOnly: SESSION_CONFIG.httpOnly,
      secure: SESSION_CONFIG.secure,
      sameSite: SESSION_CONFIG.sameSite,
      path: SESSION_CONFIG.path,
      expires: refreshExpiresDate,
    })

    // Set tenant ID cookie if provided
    if (tenantId) {
      cookieStore.set(SESSION_CONFIG.TENANT_ID, tenantId, {
        httpOnly: SESSION_CONFIG.httpOnly,
        secure: SESSION_CONFIG.secure,
        sameSite: SESSION_CONFIG.sameSite,
        path: SESSION_CONFIG.path,
        expires: refreshExpiresDate, // Same expiration as refresh token
      })
    }
  }

  /**
   * Get session information from cookies
   */
  static async getSession(): Promise<SessionInfo | null> {
    try {
      const cookieStore = await cookies()
      const accessToken = cookieStore.get(SESSION_CONFIG.ACCESS_TOKEN)?.value
      
      if (!accessToken) {
        return null
      }

      const session = await AuthService.getSession(accessToken)
      return session.isValid ? session : null
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  /**
   * Get current user from session
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getSession()
    return session?.user || null
  }

  /**
   * Get current tenant ID from cookies
   */
  static async getCurrentTenantId(): Promise<string | null> {
    try {
      const cookieStore = await cookies()
      return cookieStore.get(SESSION_CONFIG.TENANT_ID)?.value || null
    } catch (error) {
      console.error('Error getting tenant ID:', error)
      return null
    }
  }

  /**
   * Refresh session if access token is expired
   */
  static async refreshSession(): Promise<boolean> {
    try {
      const cookieStore = await cookies()
      const refreshToken = cookieStore.get(SESSION_CONFIG.REFRESH_TOKEN)?.value
      
      if (!refreshToken) {
        return false
      }

      const result = await AuthService.refreshToken(refreshToken)
      
      if (!result.success || !result.accessToken || !result.refreshToken) {
        await this.clearSession()
        return false
      }

      // Update cookies with new tokens
      await this.setSession(
        result.accessToken,
        result.refreshToken,
        await this.getCurrentTenantId() || undefined,
        result.expiresAt
      )

      return true
    } catch (error) {
      console.error('Error refreshing session:', error)
      await this.clearSession()
      return false
    }
  }

  /**
   * Clear all session cookies
   */
  static async clearSession(): Promise<void> {
    const cookieStore = await cookies()
    
    // Clear all auth-related cookies
    cookieStore.delete(SESSION_CONFIG.ACCESS_TOKEN)
    cookieStore.delete(SESSION_CONFIG.REFRESH_TOKEN)
    cookieStore.delete(SESSION_CONFIG.TENANT_ID)
  }

  /**
   * Logout user and clear session
   */
  static async logout(): Promise<void> {
    try {
      const cookieStore = await cookies()
      const accessToken = cookieStore.get(SESSION_CONFIG.ACCESS_TOKEN)?.value
      
      // Call logout on the auth service if we have a token
      if (accessToken) {
        await AuthService.logout(accessToken)
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Always clear session cookies
      await this.clearSession()
    }
  }

  /**
   * Require authentication - redirect to login if not authenticated
   */
  static async requireAuth(redirectTo?: string): Promise<AuthUser> {
    const user = await this.getCurrentUser()
    
    if (!user) {
      const loginUrl = redirectTo 
        ? `/login?redirect=${encodeURIComponent(redirectTo)}`
        : '/login'
      redirect(loginUrl)
    }
    
    return user
  }

  /**
   * Require specific role - throw error if insufficient permissions
   */
  static async requireRole(requiredRole: string, redirectTo?: string): Promise<AuthUser> {
    const user = await this.requireAuth(redirectTo)
    
    const roleHierarchy: Record<string, number> = {
      END_USER: 1,
      CLIENT_ADMIN: 2,
      COWORK_ADMIN: 3,
      SUPER_ADMIN: 4,
    }
    
    const userLevel = roleHierarchy[user.role] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 999
    
    if (userLevel < requiredLevel) {
      throw new Error(`Insufficient permissions. Required: ${requiredRole}, Current: ${user.role}`)
    }
    
    return user
  }

  /**
   * Check if session exists and is valid
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession()
    return session?.isValid || false
  }

  /**
   * Get session with automatic refresh
   */
  static async getValidSession(): Promise<SessionInfo | null> {
    let session = await this.getSession()
    
    // If session is invalid, try to refresh
    if (!session || !session.isValid) {
      const refreshed = await this.refreshSession()
      if (refreshed) {
        session = await this.getSession()
      }
    }
    
    return session?.isValid ? session : null
  }

  /**
   * Switch tenant context (for multi-tenant users)
   */
  static async switchTenant(tenantId: string): Promise<void> {
    const cookieStore = await cookies()
    const refreshExpiresDate = new Date(Date.now() + SESSION_CONFIG.REFRESH_TOKEN_EXPIRES * 1000)
    
    cookieStore.set(SESSION_CONFIG.TENANT_ID, tenantId, {
      httpOnly: SESSION_CONFIG.httpOnly,
      secure: SESSION_CONFIG.secure,
      sameSite: SESSION_CONFIG.sameSite,
      path: SESSION_CONFIG.path,
      expires: refreshExpiresDate,
    })
  }
}

/**
 * Helper functions for common authentication patterns
 */

/**
 * Get current user or redirect to login
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  return SessionManager.getCurrentUser()
}

/**
 * Require authentication in Server Actions
 */
export async function requireAuth(): Promise<AuthUser> {
  return SessionManager.requireAuth()
}

/**
 * Require specific role in Server Actions
 */
export async function requireRole(role: string): Promise<AuthUser> {
  return SessionManager.requireRole(role)
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  return SessionManager.isAuthenticated()
}

/**
 * Get current tenant ID
 */
export async function getCurrentTenantId(): Promise<string | null> {
  return SessionManager.getCurrentTenantId()
}