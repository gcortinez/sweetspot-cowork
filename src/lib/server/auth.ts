import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { UserRole, UserStatus } from '@/types/enums'
import prisma from './prisma'

// Supabase client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Types
export interface AuthUser {
  id: string
  email: string
  tenantId: string | null
  role: UserRole
  clientId?: string
}

export interface LoginRequest {
  email: string
  password: string
  tenantSlug?: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  tenantSlug: string
  role?: UserRole
  clientId?: string
}

export interface SessionInfo {
  user: AuthUser
  tenant: {
    id: string
    name: string
    slug: string
  } | null
  isValid: boolean
}

export interface LoginResult {
  success: boolean
  user?: AuthUser
  tenant?: { id: string; name: string; slug: string }
  tenants?: Array<{ id: string; name: string; slug: string }>
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  error?: string
}

/**
 * Authentication Service for Server Actions
 */
export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(
    email: string,
    password: string,
    tenantSlug?: string
  ): Promise<LoginResult> {
    try {
      // First authenticate with Supabase to verify credentials
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        })

      if (authError || !authData.user) {
        console.error('Authentication failed:', authError)
        
        // Handle specific Supabase errors
        if (authError?.message?.includes('Unexpected token')) {
          console.error('Supabase returned HTML instead of JSON. Possible causes:')
          console.error('1. SUPABASE_URL is incorrect')
          console.error('2. Network/proxy issues')
          console.error('3. Supabase project is paused')
          return {
            success: false,
            error: 'Service temporarily unavailable. Please try again later.',
          }
        }
        
        // Handle other auth errors
        if (authError?.message?.toLowerCase().includes('invalid login credentials')) {
          return {
            success: false,
            error: 'Invalid email or password',
          }
        }
        
        return {
          success: false,
          error: authError?.message || 'Invalid email or password',
        }
      }

      // If tenantSlug is provided, use single tenant logic
      if (tenantSlug) {
        // Get tenant by slug
        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug }
        })
        
        if (!tenant) {
          return {
            success: false,
            error: `Tenant with slug '${tenantSlug}' not found`,
          }
        }

        // Get user record from our database
        const userRecord = await prisma.user.findFirst({
          where: {
            email: email,
            tenantId: tenant.id
          }
        })
        
        if (!userRecord) {
          return {
            success: false,
            error: 'User not found in this workspace',
          }
        }

        // Check if user is active
        if (userRecord.status !== UserStatus.ACTIVE) {
          return {
            success: false,
            error: `User account is ${userRecord.status.toLowerCase()}`,
          }
        }

        // Check if tenant is active
        if (tenant.status !== 'ACTIVE') {
          return {
            success: false,
            error: `Tenant is ${tenant.status.toLowerCase()}`,
          }
        }

        // Update last login timestamp
        await prisma.user.update({
          where: { id: userRecord.id },
          data: { lastLoginAt: new Date() }
        })

        const authUser: AuthUser = {
          id: userRecord.id,
          email: userRecord.email,
          tenantId: userRecord.tenantId,
          role: userRecord.role as UserRole,
          clientId: userRecord.clientId || undefined,
        }

        return {
          success: true,
          user: authUser,
          accessToken: authData.session!.access_token,
          refreshToken: authData.session!.refresh_token,
          expiresAt: new Date(
            Date.now() + (authData.session!.expires_in || 3600) * 1000
          ).toISOString(),
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          },
        }
      } else {
        // No tenantSlug provided - find all tenants for this user
        const userRecords = await prisma.user.findMany({
          where: {
            email: email,
            status: UserStatus.ACTIVE
          },
          include: {
            tenant: true
          }
        })

        if (userRecords.length === 0) {
          return {
            success: false,
            error: 'No active workspaces found for this user',
          }
        }

        // Check for SUPER_ADMIN with null tenant (global admin)
        const superAdmin = userRecords.find(ur => ur.role === 'SUPER_ADMIN' && ur.tenantId === null)
        
        if (superAdmin) {
          // Update last login timestamp
          await prisma.user.update({
            where: { id: superAdmin.id },
            data: { lastLoginAt: new Date() }
          })

          const authUser: AuthUser = {
            id: superAdmin.id,
            email: superAdmin.email,
            tenantId: null, // Global super admin
            role: superAdmin.role as UserRole,
            clientId: superAdmin.clientId || undefined,
          }

          return {
            success: true,
            user: authUser,
            accessToken: authData.session!.access_token,
            refreshToken: authData.session!.refresh_token,
            expiresAt: new Date(
              Date.now() + (authData.session!.expires_in || 3600) * 1000
            ).toISOString(),
            tenant: null, // Global admin has no specific tenant
          }
        }

        // Filter for active tenants (non-super-admin users)
        const activeUserTenants = userRecords.filter(
          (ur) => ur.tenant && ur.tenant.status === 'ACTIVE'
        )

        if (activeUserTenants.length === 0) {
          return {
            success: false,
            error: 'No active workspaces found for this user',
          }
        }

        // If user belongs to only one tenant, auto-select it
        if (activeUserTenants.length === 1) {
          const userRecord = activeUserTenants[0]!
          const tenant = userRecord.tenant!

          // Update last login timestamp
          await prisma.user.update({
            where: { id: userRecord.id },
            data: { lastLoginAt: new Date() }
          })

          const authUser: AuthUser = {
            id: userRecord.id,
            email: userRecord.email,
            tenantId: userRecord.tenantId,
            role: userRecord.role as UserRole,
            clientId: userRecord.clientId || undefined,
          }

          // Handle Super Admin without tenant
          if (userRecord.role === 'SUPER_ADMIN' && !tenant) {
            return {
              success: true,
              user: authUser,
              accessToken: authData.session!.access_token,
              refreshToken: authData.session!.refresh_token,
              expiresAt: new Date(
                Date.now() + (authData.session!.expires_in || 3600) * 1000
              ).toISOString(),
              tenant: null,
            }
          }

          return {
            success: true,
            user: authUser,
            accessToken: authData.session!.access_token,
            refreshToken: authData.session!.refresh_token,
            expiresAt: new Date(
              Date.now() + (authData.session!.expires_in || 3600) * 1000
            ).toISOString(),
            tenant: {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
            },
          }
        } else {
          // Multiple tenants - return list for selection
          const tenants = activeUserTenants.map((ut) => ({
            id: ut.tenant!.id,
            name: ut.tenant!.name,
            slug: ut.tenant!.slug,
          }))

          return {
            success: true,
            tenants,
            accessToken: authData.session!.access_token,
            refreshToken: authData.session!.refresh_token,
            expiresAt: new Date(
              Date.now() + (authData.session!.expires_in || 3600) * 1000
            ).toISOString(),
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during login',
      }
    }
  }

  /**
   * Register new user
   */
  static async register(data: RegisterRequest): Promise<LoginResult> {
    try {
      // Get tenant by slug
      const tenant = await prisma.tenant.findUnique({
        where: { slug: data.tenantSlug }
      })
      
      if (!tenant) {
        return {
          success: false,
          error: `Tenant with slug '${data.tenantSlug}' not found`,
        }
      }

      // Check if tenant is active
      if (tenant.status !== 'ACTIVE') {
        return {
          success: false,
          error: `Tenant is not active`,
        }
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          tenantId: tenant.id
        }
      })

      if (existingUser) {
        return {
          success: false,
          error: 'User already exists in this workspace',
        }
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
          },
        })

      if (authError || !authData.user) {
        console.error('Supabase registration failed:', authError)
        return {
          success: false,
          error: authError?.message || 'Registration failed',
        }
      }

      // Create user in our database
      const userRecord = await prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role || UserRole.END_USER,
          status: UserStatus.ACTIVE,
          tenantId: tenant.id,
          clientId: data.clientId || null,
          supabaseId: authData.user.id,
          emailVerified: false,
          lastLoginAt: new Date(),
        }
      })

      const authUser: AuthUser = {
        id: userRecord.id,
        email: userRecord.email,
        tenantId: userRecord.tenantId,
        role: userRecord.role as UserRole,
        clientId: userRecord.clientId || undefined,
      }

      return {
        success: true,
        user: authUser,
        accessToken: authData.session?.access_token || '',
        refreshToken: authData.session?.refresh_token || '',
        expiresAt: authData.session 
          ? new Date(Date.now() + (authData.session.expires_in || 3600) * 1000).toISOString()
          : new Date(Date.now() + 3600 * 1000).toISOString(),
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during registration',
      }
    }
  }

  /**
   * Get session information from token
   */
  static async getSession(token: string): Promise<SessionInfo> {
    try {
      // Verify token with Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

      if (error || !user) {
        return {
          user: null as any,
          tenant: null,
          isValid: false,
        }
      }

      // Get user record from our database
      const userRecord = await prisma.user.findFirst({
        where: {
          OR: [
            { supabaseId: user.id },
            { email: user.email }
          ]
        },
        include: {
          tenant: true
        }
      })

      if (!userRecord) {
        return {
          user: null as any,
          tenant: null,
          isValid: false,
        }
      }

      const authUser: AuthUser = {
        id: userRecord.id,
        email: userRecord.email,
        tenantId: userRecord.tenantId,
        role: userRecord.role as UserRole,
        clientId: userRecord.clientId || undefined,
      }

      return {
        user: authUser,
        tenant: userRecord.tenant ? {
          id: userRecord.tenant.id,
          name: userRecord.tenant.name,
          slug: userRecord.tenant.slug,
        } : null,
        isValid: true,
      }
    } catch (error) {
      console.error('Session validation error:', error)
      return {
        user: null as any,
        tenant: null,
        isValid: false,
      }
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<LoginResult> {
    try {
      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken,
      })

      if (error || !data.session) {
        return {
          success: false,
          error: 'Failed to refresh token',
        }
      }

      // Get user session info to return complete user data
      const sessionInfo = await AuthService.getSession(data.session.access_token)
      
      if (!sessionInfo.isValid || !sessionInfo.user) {
        return {
          success: false,
          error: 'Failed to validate refreshed session',
        }
      }

      return {
        success: true,
        user: sessionInfo.user,
        tenant: sessionInfo.tenant,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: new Date(
          Date.now() + (data.session.expires_in || 3600) * 1000
        ).toISOString(),
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during token refresh',
      }
    }
  }

  /**
   * Logout user
   */
  static async logout(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        return {
          success: false,
          error: error.message,
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during logout',
      }
    }
  }
}

/**
 * Get current user from session token in cookies
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }

    const session = await AuthService.getSession(token)
    return session.isValid ? session.user : null
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * Require specific role for access
 */
export async function requireRole(user: AuthUser | null, requiredRole: UserRole): Promise<void> {
  if (!user) {
    throw new Error('Authentication required')
  }

  const roleHierarchy: Record<UserRole, number> = {
    END_USER: 1,
    CLIENT_ADMIN: 2,
    COWORK_ADMIN: 3,
    SUPER_ADMIN: 4,
  }

  const userLevel = roleHierarchy[user.role]
  const requiredLevel = roleHierarchy[requiredRole]

  if (userLevel < requiredLevel) {
    throw new Error('Insufficient permissions')
  }
}

/**
 * Require authentication
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}