/**
 * Authentication Server Actions Tests
 * 
 * Note: These tests require a running database and Supabase connection.
 * Run with: npm test -- auth.test.ts
 */

import { loginAction, registerAction, logoutAction } from '../auth'
import type { LoginRequest, RegisterRequest } from '../../validations'

// Mock data for testing
const mockTenant = 'test-workspace'
const mockUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
}

describe('Authentication Server Actions', () => {
  // Test login validation
  describe('loginAction', () => {
    it('should reject invalid email format', async () => {
      const invalidData: LoginRequest = {
        email: 'invalid-email',
        password: 'password123',
        tenantSlug: mockTenant,
        rememberMe: false,
      }

      const result = await loginAction(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.fieldErrors?.email).toContain('Invalid email format')
    })

    it('should reject empty password', async () => {
      const invalidData: LoginRequest = {
        email: 'test@example.com',
        password: '',
        tenantSlug: mockTenant,
        rememberMe: false,
      }

      const result = await loginAction(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.fieldErrors?.password).toContain('Password is required')
    })

    it('should validate input data structure', async () => {
      const validData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
        tenantSlug: mockTenant,
        rememberMe: false,
      }

      // Note: This will fail authentication but should pass validation
      const result = await loginAction(validData)

      // Should not be a validation error
      expect(result.error).not.toBe('Validation failed')
      expect(result.fieldErrors).toBeUndefined()
    })
  })

  // Test registration validation
  describe('registerAction', () => {
    it('should reject weak password', async () => {
      const invalidData: RegisterRequest = {
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        firstName: 'Test',
        lastName: 'User',
        tenantSlug: mockTenant,
        role: 'END_USER' as any,
        phone: '+1234567890',
        acceptTerms: true,
      }

      const result = await registerAction(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.fieldErrors?.password).toBeDefined()
    })

    it('should reject mismatched passwords', async () => {
      const invalidData: RegisterRequest = {
        email: 'test@example.com',
        password: 'ValidPassword123!',
        confirmPassword: 'DifferentPassword123!',
        firstName: 'Test',
        lastName: 'User',
        tenantSlug: mockTenant,
        role: 'END_USER' as any,
        phone: '+1234567890',
        acceptTerms: true,
      }

      const result = await registerAction(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.fieldErrors?.confirmPassword).toContain('Passwords do not match')
    })

    it('should reject when terms not accepted', async () => {
      const invalidData: RegisterRequest = {
        email: 'test@example.com',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        tenantSlug: mockTenant,
        role: 'END_USER' as any,
        phone: '+1234567890',
        acceptTerms: false,
      }

      const result = await registerAction(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.fieldErrors?.acceptTerms).toContain('You must accept the terms and conditions')
    })

    it('should validate proper registration data structure', async () => {
      const validData: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
        firstName: 'New',
        lastName: 'User',
        tenantSlug: mockTenant,
        role: 'END_USER' as any,
        phone: '+1234567890',
        acceptTerms: true,
      }

      const result = await registerAction(validData)

      // Should not be a validation error (may fail for other reasons like duplicate user)
      expect(result.error).not.toBe('Validation failed')
      expect(result.fieldErrors).toBeUndefined()
    })
  })

  // Test logout
  describe('logoutAction', () => {
    it('should always succeed even without active session', async () => {
      const result = await logoutAction()

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/login')
    })
  })

  // Integration test scenario
  describe('Authentication Flow Integration', () => {
    // Note: This test requires actual database connection and is more of an integration test
    it('should handle complete auth flow gracefully', async () => {
      // 1. Attempt login with non-existent user
      const loginResult = await loginAction({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
        tenantSlug: mockTenant,
        rememberMe: false,
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBeDefined()
      expect(loginResult.error).not.toBe('Validation failed') // Should be auth error, not validation

      // 2. Attempt registration with proper data
      const registerResult = await registerAction({
        email: 'integrationtest@example.com',
        password: 'IntegrationTest123!',
        confirmPassword: 'IntegrationTest123!',
        firstName: 'Integration',
        lastName: 'Test',
        tenantSlug: mockTenant,
        role: 'END_USER' as any,
        phone: '+1234567890',
        acceptTerms: true,
      })

      // Note: This might succeed or fail depending on whether tenant exists
      // The important thing is that it's not a validation error
      expect(registerResult.error).not.toBe('Validation failed')

      // 3. Logout should always work
      const logoutResult = await logoutAction()
      expect(logoutResult.success).toBe(true)
    })
  })
})

// Validation utilities tests
describe('Validation Utilities', () => {
  it('should properly format validation errors', async () => {
    const invalidLogin: LoginRequest = {
      email: 'invalid',
      password: '',
      tenantSlug: '',
      rememberMe: false,
    }

    const result = await loginAction(invalidLogin)

    expect(result.success).toBe(false)
    expect(result.fieldErrors).toBeDefined()
    expect(result.fieldErrors?.email).toBeDefined()
    expect(result.fieldErrors?.password).toBeDefined()
  })

  it('should handle unexpected input gracefully', async () => {
    // @ts-ignore - Intentionally testing with invalid input
    const result = await loginAction(null)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

// Security tests
describe('Authentication Security', () => {
  it('should not expose sensitive information in error messages', async () => {
    const loginResult = await loginAction({
      email: 'test@example.com',
      password: 'wrongpassword',
      tenantSlug: mockTenant,
      rememberMe: false,
    })

    expect(loginResult.success).toBe(false)
    // Error message should not reveal whether user exists or not
    expect(loginResult.error).not.toContain('user does not exist')
    expect(loginResult.error).not.toContain('password is incorrect')
  })

  it('should sanitize input data', async () => {
    const maliciousData: LoginRequest = {
      email: 'test@example.com<script>alert("xss")</script>',
      password: 'password<script>',
      tenantSlug: mockTenant,
      rememberMe: false,
    }

    const result = await loginAction(maliciousData)

    // Should reject due to email validation
    expect(result.success).toBe(false)
    expect(result.fieldErrors?.email).toContain('Invalid email format')
  })
})