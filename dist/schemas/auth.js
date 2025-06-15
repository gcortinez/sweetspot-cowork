"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResponseSchema = exports.loginResponseSchema = exports.deleteAccountSchema = exports.acceptInvitationSchema = exports.inviteUserSchema = exports.sessionInfoSchema = exports.resendVerificationSchema = exports.verifyEmailSchema = exports.disable2FASchema = exports.verify2FASchema = exports.enable2FASchema = exports.logoutSchema = exports.refreshTokenSchema = exports.userFiltersSchema = exports.updateUserSchema = exports.createUserSchema = exports.updateProfileSchema = exports.changePasswordSchema = exports.passwordResetSchema = exports.passwordResetRequestSchema = exports.registerSchema = exports.loginSchema = exports.userStatusSchema = exports.userRoleSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.userRoleSchema = (0, common_1.createEnumSchema)([
    "SUPER_ADMIN",
    "COWORK_ADMIN",
    "CLIENT_ADMIN",
    "END_USER",
    "GUEST"
], "Invalid user role");
exports.userStatusSchema = (0, common_1.createEnumSchema)([
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "PENDING_VERIFICATION"
], "Invalid user status");
exports.loginSchema = zod_1.z.object({
    email: common_1.emailSchema,
    password: zod_1.z.string().min(1, "Password is required"),
    workspace: zod_1.z.string().min(1, "Workspace identifier is required").optional(),
    rememberMe: zod_1.z.boolean().default(false),
});
exports.registerSchema = zod_1.z.object({
    email: common_1.emailSchema,
    password: common_1.passwordSchema,
    confirmPassword: zod_1.z.string(),
    firstName: zod_1.z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50, "Last name too long"),
    phone: common_1.phoneSchema,
    workspace: zod_1.z.string().min(1, "Workspace identifier is required").optional(),
    acceptTerms: zod_1.z.boolean().refine(val => val === true, {
        message: "You must accept the terms and conditions",
    }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.passwordResetRequestSchema = zod_1.z.object({
    email: common_1.emailSchema,
    workspace: zod_1.z.string().optional(),
});
exports.passwordResetSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
    password: common_1.passwordSchema,
    confirmPassword: zod_1.z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: common_1.passwordSchema,
    confirmPassword: zod_1.z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
});
exports.updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required").max(50, "First name too long").optional(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50, "Last name too long").optional(),
    phone: common_1.phoneSchema,
    avatar: zod_1.z.string().url("Invalid avatar URL").optional(),
    bio: zod_1.z.string().max(500, "Bio too long").optional(),
    website: zod_1.z.string().url("Invalid website URL").optional(),
    company: zod_1.z.string().max(100, "Company name too long").optional(),
    position: zod_1.z.string().max(100, "Position too long").optional(),
    location: zod_1.z.string().max(100, "Location too long").optional(),
});
exports.createUserSchema = zod_1.z.object({
    email: common_1.emailSchema,
    firstName: zod_1.z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50, "Last name too long"),
    role: exports.userRoleSchema,
    phone: common_1.phoneSchema,
    tenantId: zod_1.z.string().uuid("Invalid tenant ID").optional(),
    clientId: zod_1.z.string().uuid("Invalid client ID").optional(),
    sendInvite: zod_1.z.boolean().default(true),
});
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required").max(50, "First name too long").optional(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50, "Last name too long").optional(),
    email: common_1.emailSchema.optional(),
    phone: common_1.phoneSchema,
    role: exports.userRoleSchema.optional(),
    status: exports.userStatusSchema.optional(),
    avatar: zod_1.z.string().url("Invalid avatar URL").optional(),
    bio: zod_1.z.string().max(500, "Bio too long").optional(),
    website: zod_1.z.string().url("Invalid website URL").optional(),
    company: zod_1.z.string().max(100, "Company name too long").optional(),
    position: zod_1.z.string().max(100, "Position too long").optional(),
    location: zod_1.z.string().max(100, "Location too long").optional(),
});
exports.userFiltersSchema = zod_1.z.object({
    role: zod_1.z.array(exports.userRoleSchema).optional(),
    status: zod_1.z.array(exports.userStatusSchema).optional(),
    tenantId: zod_1.z.string().uuid().optional(),
    clientId: zod_1.z.string().uuid().optional(),
    email: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    createdAfter: zod_1.z.string().datetime().optional(),
    createdBefore: zod_1.z.string().datetime().optional(),
    lastLoginAfter: zod_1.z.string().datetime().optional(),
    lastLoginBefore: zod_1.z.string().datetime().optional(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
});
exports.logoutSchema = zod_1.z.object({
    everywhere: zod_1.z.boolean().default(false),
});
exports.enable2FASchema = zod_1.z.object({
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.verify2FASchema = zod_1.z.object({
    token: zod_1.z.string().length(6, "2FA token must be 6 digits").regex(/^\d{6}$/, "2FA token must be numeric"),
    code: zod_1.z.string().min(1, "Verification code is required"),
});
exports.disable2FASchema = zod_1.z.object({
    password: zod_1.z.string().min(1, "Password is required"),
    token: zod_1.z.string().length(6, "2FA token must be 6 digits").regex(/^\d{6}$/, "2FA token must be numeric"),
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Verification token is required"),
});
exports.resendVerificationSchema = zod_1.z.object({
    email: common_1.emailSchema,
});
exports.sessionInfoSchema = zod_1.z.object({
    deviceInfo: zod_1.z.object({
        userAgent: zod_1.z.string().optional(),
        ip: zod_1.z.string().optional(),
        device: zod_1.z.string().optional(),
        browser: zod_1.z.string().optional(),
        os: zod_1.z.string().optional(),
    }).optional(),
});
exports.inviteUserSchema = zod_1.z.object({
    email: common_1.emailSchema,
    role: exports.userRoleSchema.default("END_USER"),
    firstName: zod_1.z.string().min(1, "First name is required").max(50, "First name too long").optional(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50, "Last name too long").optional(),
    message: zod_1.z.string().max(500, "Invitation message too long").optional(),
    expiresIn: zod_1.z.number().positive("Expiration time must be positive").max(30, "Expiration cannot exceed 30 days").default(7),
});
exports.acceptInvitationSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Invitation token is required"),
    password: common_1.passwordSchema,
    confirmPassword: zod_1.z.string(),
    firstName: zod_1.z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50, "Last name too long"),
    phone: common_1.phoneSchema,
    acceptTerms: zod_1.z.boolean().refine(val => val === true, {
        message: "You must accept the terms and conditions",
    }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.deleteAccountSchema = zod_1.z.object({
    password: zod_1.z.string().min(1, "Password is required"),
    confirmation: zod_1.z.string().refine(val => val === "DELETE", {
        message: "Please type 'DELETE' to confirm account deletion",
    }),
    feedback: zod_1.z.string().max(1000, "Feedback too long").optional(),
});
exports.loginResponseSchema = zod_1.z.object({
    user: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        email: common_1.emailSchema,
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        role: exports.userRoleSchema,
        status: exports.userStatusSchema,
        avatar: zod_1.z.string().url().optional(),
        lastLoginAt: zod_1.z.string().datetime().optional(),
    }),
    tokens: zod_1.z.object({
        accessToken: zod_1.z.string(),
        refreshToken: zod_1.z.string(),
        expiresIn: zod_1.z.number(),
    }),
    tenant: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        slug: zod_1.z.string(),
    }).optional(),
});
exports.userResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: common_1.emailSchema,
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    role: exports.userRoleSchema,
    status: exports.userStatusSchema,
    phone: zod_1.z.string().optional(),
    avatar: zod_1.z.string().url().optional(),
    bio: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional(),
    company: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    lastLoginAt: zod_1.z.string().datetime().optional(),
    emailVerifiedAt: zod_1.z.string().datetime().optional(),
    twoFactorEnabled: zod_1.z.boolean(),
});
exports.default = {
    userRoleSchema: exports.userRoleSchema,
    userStatusSchema: exports.userStatusSchema,
    loginSchema: exports.loginSchema,
    registerSchema: exports.registerSchema,
    passwordResetRequestSchema: exports.passwordResetRequestSchema,
    passwordResetSchema: exports.passwordResetSchema,
    changePasswordSchema: exports.changePasswordSchema,
    updateProfileSchema: exports.updateProfileSchema,
    createUserSchema: exports.createUserSchema,
    updateUserSchema: exports.updateUserSchema,
    userFiltersSchema: exports.userFiltersSchema,
    refreshTokenSchema: exports.refreshTokenSchema,
    logoutSchema: exports.logoutSchema,
    enable2FASchema: exports.enable2FASchema,
    verify2FASchema: exports.verify2FASchema,
    disable2FASchema: exports.disable2FASchema,
    verifyEmailSchema: exports.verifyEmailSchema,
    resendVerificationSchema: exports.resendVerificationSchema,
    sessionInfoSchema: exports.sessionInfoSchema,
    inviteUserSchema: exports.inviteUserSchema,
    acceptInvitationSchema: exports.acceptInvitationSchema,
    deleteAccountSchema: exports.deleteAccountSchema,
    loginResponseSchema: exports.loginResponseSchema,
    userResponseSchema: exports.userResponseSchema,
};
//# sourceMappingURL=auth.js.map