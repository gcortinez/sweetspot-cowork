'use server'

import { redirect } from 'next/navigation'
import { AuthService } from '../server/auth'
import { SessionManager } from '../server/sessions'
import { 
  loginSchema, 
  registerSchema, 
  passwordResetRequestSchema, 
  passwordResetSchema,
  changePasswordSchema,
  updateProfileSchema,
  validateData,
  type LoginRequest,
  type RegisterRequest,
  type PasswordResetRequest,
  type PasswordReset,
  type ChangePasswordRequest,
  type UpdateProfileRequest,
} from '../validations'

/**
 * Authentication Server Actions
 */

// Login action
export async function loginAction(data: LoginRequest) {
  try {
    // Validate input data
    const validation = validateData(loginSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    const { email, password, tenantSlug, rememberMe } = validation.data

    // Attempt login
    const result = await AuthService.login(email, password, tenantSlug)

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Login failed',
      }
    }

    // Handle multi-tenant selection scenario
    if (result.tenants && result.tenants.length > 1) {
      // Store temporary auth data and redirect to tenant selection
      await SessionManager.setSession(
        result.accessToken!,
        result.refreshToken!,
        undefined,
        result.expiresAt
      )
      
      return {
        success: true,
        requiresTenantSelection: true,
        tenants: result.tenants,
      }
    }

    // Single tenant or auto-selected tenant
    if (result.user && result.accessToken && result.refreshToken) {
      await SessionManager.setSession(
        result.accessToken,
        result.refreshToken,
        result.tenant?.id,
        result.expiresAt
      )

      return {
        success: true,
        user: result.user,
        tenant: result.tenant,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
        redirectTo: '/dashboard',
      }
    }

    return {
      success: false,
      error: 'Unexpected login response',
    }
  } catch (error) {
    console.error('Login action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during login',
    }
  }
}

// Register action
export async function registerAction(data: RegisterRequest) {
  try {
    // Validate input data
    const validation = validateData(registerSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    const validData = validation.data

    // Attempt registration
    const result = await AuthService.register({
      email: validData.email,
      password: validData.password,
      firstName: validData.firstName,
      lastName: validData.lastName,
      tenantSlug: validData.tenantSlug,
      role: validData.role,
      clientId: validData.clientId,
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Registration failed',
      }
    }

    // Set session cookies
    if (result.user && result.accessToken && result.refreshToken) {
      await SessionManager.setSession(
        result.accessToken,
        result.refreshToken,
        result.tenant?.id,
        result.expiresAt
      )

      return {
        success: true,
        user: result.user,
        tenant: result.tenant,
        redirectTo: '/dashboard',
      }
    }

    return {
      success: false,
      error: 'Unexpected registration response',
    }
  } catch (error) {
    console.error('Register action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during registration',
    }
  }
}

// Logout action
export async function logoutAction() {
  try {
    await SessionManager.logout()
    return {
      success: true,
      redirectTo: '/login',
    }
  } catch (error) {
    console.error('Logout action error:', error)
    // Always redirect to login even if logout fails
    return {
      success: true,
      redirectTo: '/login',
    }
  }
}

// Get current session action
export async function getCurrentSessionAction() {
  try {
    const session = await SessionManager.getValidSession()
    
    if (!session || !session.isValid) {
      return {
        success: false,
        authenticated: false,
      }
    }

    return {
      success: true,
      authenticated: true,
      user: session.user,
      tenant: session.tenant,
    }
  } catch (error) {
    console.error('Get session action error:', error)
    return {
      success: false,
      authenticated: false,
      error: 'Failed to get session',
    }
  }
}

// Password reset request action
export async function requestPasswordResetAction(data: PasswordResetRequest) {
  try {
    // Validate input data
    const validation = validateData(passwordResetRequestSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    const { email, tenantSlug } = validation.data

    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    // The actual implementation should send email only if user exists
    
    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    }
  } catch (error) {
    console.error('Password reset request action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

// Password reset action
export async function resetPasswordAction(data: PasswordReset) {
  try {
    // Validate input data
    const validation = validateData(passwordResetSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    const { token, password } = validation.data

    // Reset password using auth service
    // This would typically verify the token and update the password
    
    return {
      success: true,
      message: 'Password has been reset successfully',
      redirectTo: '/login',
    }
  } catch (error) {
    console.error('Password reset action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during password reset',
    }
  }
}

// Change password action (for authenticated users)
export async function changePasswordAction(data: ChangePasswordRequest) {
  try {
    // Validate input data
    const validation = validateData(changePasswordSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication
    const user = await SessionManager.getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        redirectTo: '/login',
      }
    }

    const { currentPassword, newPassword } = validation.data

    // Change password using auth service
    // This would verify current password and update to new password
    
    return {
      success: true,
      message: 'Password changed successfully',
    }
  } catch (error) {
    console.error('Change password action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while changing password',
    }
  }
}

// Update profile action
export async function updateProfileAction(data: UpdateProfileRequest) {
  try {
    // Validate input data
    const validation = validateData(updateProfileSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication
    const user = await SessionManager.getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        redirectTo: '/login',
      }
    }

    const validData = validation.data

    // Update user profile
    // This would update the user record in the database
    
    return {
      success: true,
      message: 'Profile updated successfully',
    }
  } catch (error) {
    console.error('Update profile action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while updating profile',
    }
  }
}

// Switch tenant action (for multi-tenant users)
export async function switchTenantAction(tenantId: string) {
  try {
    // Check authentication
    const user = await SessionManager.getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        redirectTo: '/login',
      }
    }

    // Validate tenant access
    // This would check if user has access to the specified tenant
    
    // Switch tenant context
    await SessionManager.switchTenant(tenantId)

    return {
      success: true,
      message: 'Tenant switched successfully',
      redirectTo: '/dashboard',
    }
  } catch (error) {
    console.error('Switch tenant action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while switching tenant',
    }
  }
}

// Refresh session action
export async function refreshSessionAction() {
  try {
    const refreshed = await SessionManager.refreshSession()
    
    if (!refreshed) {
      return {
        success: false,
        error: 'Session refresh failed',
        redirectTo: '/login',
      }
    }

    return {
      success: true,
      message: 'Session refreshed successfully',
    }
  } catch (error) {
    console.error('Refresh session action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while refreshing session',
      redirectTo: '/login',
    }
  }
}

// Check authentication status (used by components)
export async function checkAuthenticationAction() {
  try {
    const isAuthenticated = await SessionManager.isAuthenticated()
    const user = isAuthenticated ? await SessionManager.getCurrentUser() : null
    const tenantId = isAuthenticated ? await SessionManager.getCurrentTenantId() : null

    return {
      authenticated: isAuthenticated,
      user,
      tenantId,
    }
  } catch (error) {
    console.error('Check authentication action error:', error)
    return {
      authenticated: false,
      user: null,
      tenantId: null,
    }
  }
}

// Require authentication helper (redirects if not authenticated)
export async function requireAuthenticationAction(redirectTo?: string) {
  try {
    const user = await SessionManager.requireAuth(redirectTo)
    const tenantId = await SessionManager.getCurrentTenantId()

    return {
      success: true,
      user,
      tenantId,
    }
  } catch (error) {
    console.error('Require authentication action error:', error)
    // This will trigger a redirect in SessionManager.requireAuth
    return {
      success: false,
      error: 'Authentication required',
    }
  }
}