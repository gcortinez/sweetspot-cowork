import { z } from "zod";
import { emailSchema, passwordSchema, phoneSchema, createEnumSchema } from "./common";

// User roles enum
export const userRoleSchema = createEnumSchema([
  "SUPER_ADMIN",
  "COWORK_ADMIN", 
  "CLIENT_ADMIN",
  "END_USER",
  "GUEST"
], "Invalid user role");

// User status enum
export const userStatusSchema = createEnumSchema([
  "ACTIVE",
  "INACTIVE", 
  "SUSPENDED",
  "PENDING_VERIFICATION"
], "Invalid user status");

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  workspace: z.string().min(1, "Workspace identifier is required").optional(),
  rememberMe: z.boolean().default(false),
});

// Register schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  phone: phoneSchema,
  workspace: z.string().min(1, "Workspace identifier is required").optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
  workspace: z.string().optional(),
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long").optional(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long").optional(),
  phone: phoneSchema,
  avatar: z.string().url("Invalid avatar URL").optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  website: z.string().url("Invalid website URL").optional(),
  company: z.string().max(100, "Company name too long").optional(),
  position: z.string().max(100, "Position too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
});

// Create user schema (admin)
export const createUserSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  role: userRoleSchema,
  phone: phoneSchema,
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
  clientId: z.string().uuid("Invalid client ID").optional(),
  sendInvite: z.boolean().default(true),
});

// Update user schema (admin)
export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long").optional(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long").optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  website: z.string().url("Invalid website URL").optional(),
  company: z.string().max(100, "Company name too long").optional(),
  position: z.string().max(100, "Position too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
});

// User filters schema
export const userFiltersSchema = z.object({
  role: z.array(userRoleSchema).optional(),
  status: z.array(userStatusSchema).optional(),
  tenantId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  email: z.string().optional(),
  search: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  lastLoginAfter: z.string().datetime().optional(),
  lastLoginBefore: z.string().datetime().optional(),
});

// Session management schemas
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  everywhere: z.boolean().default(false),
});

// Two-factor authentication schemas
export const enable2FASchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const verify2FASchema = z.object({
  token: z.string().length(6, "2FA token must be 6 digits").regex(/^\d{6}$/, "2FA token must be numeric"),
  code: z.string().min(1, "Verification code is required"),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, "Password is required"),
  token: z.string().length(6, "2FA token must be 6 digits").regex(/^\d{6}$/, "2FA token must be numeric"),
});

// Account verification schemas
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// Session info schema
export const sessionInfoSchema = z.object({
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    ip: z.string().optional(),
    device: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
  }).optional(),
});

// Invitation schemas
export const inviteUserSchema = z.object({
  email: emailSchema,
  role: userRoleSchema.default("END_USER"),
  firstName: z.string().min(1, "First name is required").max(50, "First name too long").optional(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long").optional(),
  message: z.string().max(500, "Invitation message too long").optional(),
  expiresIn: z.number().positive("Expiration time must be positive").max(30, "Expiration cannot exceed 30 days").default(7), // days
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  phone: phoneSchema,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Account deletion schema
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmation: z.string().refine(val => val === "DELETE", {
    message: "Please type 'DELETE' to confirm account deletion",
  }),
  feedback: z.string().max(1000, "Feedback too long").optional(),
});

// Response schemas
export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: emailSchema,
    firstName: z.string(),
    lastName: z.string(),
    role: userRoleSchema,
    status: userStatusSchema,
    avatar: z.string().url().optional(),
    lastLoginAt: z.string().datetime().optional(),
  }),
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
  }),
  tenant: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  status: userStatusSchema,
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().optional(),
  website: z.string().url().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
  emailVerifiedAt: z.string().datetime().optional(),
  twoFactorEnabled: z.boolean(),
});

export default {
  userRoleSchema,
  userStatusSchema,
  loginSchema,
  registerSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  updateProfileSchema,
  createUserSchema,
  updateUserSchema,
  userFiltersSchema,
  refreshTokenSchema,
  logoutSchema,
  enable2FASchema,
  verify2FASchema,
  disable2FASchema,
  verifyEmailSchema,
  resendVerificationSchema,
  sessionInfoSchema,
  inviteUserSchema,
  acceptInvitationSchema,
  deleteAccountSchema,
  loginResponseSchema,
  userResponseSchema,
};