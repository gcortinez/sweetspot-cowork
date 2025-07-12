import { z } from 'zod'
import { emailSchema, passwordSchema, nameSchema, slugSchema, phoneSchema } from './common'
import { UserRole } from '@/types/database'

/**
 * Authentication validation schemas for Server Actions
 */

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  tenantSlug: slugSchema.optional(),
  rememberMe: z.boolean().default(false),
})

export type LoginRequest = z.infer<typeof loginSchema>

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
  firstName: nameSchema,
  lastName: nameSchema,
  tenantSlug: slugSchema,
  role: z.nativeEnum(UserRole).default(UserRole.END_USER),
  clientId: z.string().uuid().optional(),
  phone: phoneSchema,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegisterRequest = z.infer<typeof registerSchema>

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
  tenantSlug: slugSchema,
})

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type PasswordReset = z.infer<typeof passwordResetSchema>

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
})

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema,
  bio: z.string().max(500, 'Bio is too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      marketing: z.boolean().default(false),
    }).optional(),
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    language: z.string().default('en'),
    timezone: z.string().default('UTC'),
  }).optional(),
})

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>

// Create user schema (for admin use)
export const createUserSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.nativeEnum(UserRole),
  tenantId: z.string().uuid('Invalid tenant ID'),
  clientId: z.string().uuid().optional(),
  phone: phoneSchema,
  sendInvitation: z.boolean().default(true),
  temporaryPassword: z.boolean().default(false),
})

export type CreateUserRequest = z.infer<typeof createUserSchema>

// Update user schema (for admin use)
export const updateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  clientId: z.string().uuid().optional(),
  phone: phoneSchema,
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  permissions: z.array(z.string()).optional(),
})

export type UpdateUserRequest = z.infer<typeof updateUserSchema>

// User filters schema
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  clientId: z.string().uuid().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  lastLoginAfter: z.string().datetime().optional(),
  lastLoginBefore: z.string().datetime().optional(),
})

export type UserFilters = z.infer<typeof userFiltersSchema>

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>

// Logout schema
export const logoutSchema = z.object({
  logoutFromAllDevices: z.boolean().default(false),
})

export type LogoutRequest = z.infer<typeof logoutSchema>

// Email verification schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>

// Resend verification schema
export const resendVerificationSchema = z.object({
  email: emailSchema,
  tenantSlug: slugSchema,
})

export type ResendVerificationRequest = z.infer<typeof resendVerificationSchema>

// Invite user schema
export const inviteUserSchema = z.object({
  email: emailSchema,
  role: z.nativeEnum(UserRole),
  clientId: z.string().uuid().optional(),
  message: z.string().max(500, 'Invitation message is too long').optional(),
  expiresIn: z.number().min(1).max(168).default(72), // Hours
})

export type InviteUserRequest = z.infer<typeof inviteUserSchema>

// Accept invitation schema
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  firstName: nameSchema,
  lastName: nameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
  phone: phoneSchema,
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type AcceptInvitationRequest = z.infer<typeof acceptInvitationSchema>

// Delete account schema
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion'),
  confirmation: z.string().refine(val => val === 'DELETE_MY_ACCOUNT', {
    message: 'You must type "DELETE_MY_ACCOUNT" to confirm deletion',
  }),
  reason: z.string().max(500, 'Reason is too long').optional(),
})

export type DeleteAccountRequest = z.infer<typeof deleteAccountSchema>

// Two-factor authentication schemas
export const enable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

export type Enable2FARequest = z.infer<typeof enable2FASchema>

export const verify2FASchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits').regex(/^\d{6}$/, 'Token must contain only digits'),
  secret: z.string().min(1, 'Secret is required'),
})

export type Verify2FARequest = z.infer<typeof verify2FASchema>

export const disable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
  token: z.string().length(6, 'Token must be 6 digits').regex(/^\d{6}$/, 'Token must contain only digits'),
})

export type Disable2FARequest = z.infer<typeof disable2FASchema>

// Session management schemas
export const switchTenantSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
})

export type SwitchTenantRequest = z.infer<typeof switchTenantSchema>

// Bulk user operations
export const bulkUserOperationSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
  operation: z.enum(['activate', 'deactivate', 'suspend', 'delete']),
  reason: z.string().max(500, 'Reason is too long').optional(),
})

export type BulkUserOperationRequest = z.infer<typeof bulkUserOperationSchema>

// Password policy schema
export const passwordPolicySchema = z.object({
  minLength: z.number().min(8).max(128).default(8),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireSpecialChars: z.boolean().default(true),
  preventReuse: z.number().min(0).max(24).default(5),
  expiryDays: z.number().min(0).max(365).default(90),
})

export type PasswordPolicy = z.infer<typeof passwordPolicySchema>

// Account lockout schema
export const accountLockoutSchema = z.object({
  maxAttempts: z.number().min(3).max(20).default(5),
  lockoutDuration: z.number().min(5).max(1440).default(30), // Minutes
  cooldownPeriod: z.number().min(1).max(60).default(15), // Minutes
})

export type AccountLockout = z.infer<typeof accountLockoutSchema>