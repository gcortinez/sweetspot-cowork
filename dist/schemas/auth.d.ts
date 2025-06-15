import { z } from "zod";
export declare const userRoleSchema: z.ZodEnum<[string, string, string, string, string]>;
export declare const userStatusSchema: z.ZodEnum<[string, string, string, string]>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    workspace: z.ZodOptional<z.ZodString>;
    rememberMe: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    rememberMe: boolean;
    workspace?: string | undefined;
}, {
    password: string;
    email: string;
    workspace?: string | undefined;
    rememberMe?: boolean | undefined;
}>;
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    workspace: z.ZodOptional<z.ZodString>;
    acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    email: string;
    acceptTerms: boolean;
    phone?: string | undefined;
    workspace?: string | undefined;
}, {
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    email: string;
    acceptTerms: boolean;
    phone?: string | undefined;
    workspace?: string | undefined;
}>, {
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    email: string;
    acceptTerms: boolean;
    phone?: string | undefined;
    workspace?: string | undefined;
}, {
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    email: string;
    acceptTerms: boolean;
    phone?: string | undefined;
    workspace?: string | undefined;
}>;
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
    workspace: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    workspace?: string | undefined;
}, {
    email: string;
    workspace?: string | undefined;
}>;
export declare const passwordResetSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    confirmPassword: string;
    token: string;
}, {
    password: string;
    confirmPassword: string;
    token: string;
}>, {
    password: string;
    confirmPassword: string;
    token: string;
}, {
    password: string;
    confirmPassword: string;
    token: string;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    company?: string | undefined;
    position?: string | undefined;
    avatar?: string | undefined;
    location?: string | undefined;
    bio?: string | undefined;
    website?: string | undefined;
}, {
    phone?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    company?: string | undefined;
    position?: string | undefined;
    avatar?: string | undefined;
    location?: string | undefined;
    bio?: string | undefined;
    website?: string | undefined;
}>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<[string, string, string, string, string]>;
    phone: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    sendInvite: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    sendInvite: boolean;
    tenantId?: string | undefined;
    phone?: string | undefined;
    clientId?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    tenantId?: string | undefined;
    phone?: string | undefined;
    clientId?: string | undefined;
    sendInvite?: boolean | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<[string, string, string, string, string]>>;
    status: z.ZodOptional<z.ZodEnum<[string, string, string, string]>>;
    avatar: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    status?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | undefined;
    company?: string | undefined;
    position?: string | undefined;
    avatar?: string | undefined;
    role?: string | undefined;
    location?: string | undefined;
    bio?: string | undefined;
    website?: string | undefined;
}, {
    phone?: string | undefined;
    status?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | undefined;
    company?: string | undefined;
    position?: string | undefined;
    avatar?: string | undefined;
    role?: string | undefined;
    location?: string | undefined;
    bio?: string | undefined;
    website?: string | undefined;
}>;
export declare const userFiltersSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodArray<z.ZodEnum<[string, string, string, string, string]>, "many">>;
    status: z.ZodOptional<z.ZodArray<z.ZodEnum<[string, string, string, string]>, "many">>;
    tenantId: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    createdAfter: z.ZodOptional<z.ZodString>;
    createdBefore: z.ZodOptional<z.ZodString>;
    lastLoginAfter: z.ZodOptional<z.ZodString>;
    lastLoginBefore: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    tenantId?: string | undefined;
    clientId?: string | undefined;
    status?: string[] | undefined;
    email?: string | undefined;
    role?: string[] | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    lastLoginAfter?: string | undefined;
    lastLoginBefore?: string | undefined;
}, {
    search?: string | undefined;
    tenantId?: string | undefined;
    clientId?: string | undefined;
    status?: string[] | undefined;
    email?: string | undefined;
    role?: string[] | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    lastLoginAfter?: string | undefined;
    lastLoginBefore?: string | undefined;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const logoutSchema: z.ZodObject<{
    everywhere: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    everywhere: boolean;
}, {
    everywhere?: boolean | undefined;
}>;
export declare const enable2FASchema: z.ZodObject<{
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
}, {
    password: string;
}>;
export declare const verify2FASchema: z.ZodObject<{
    token: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    code: string;
}, {
    token: string;
    code: string;
}>;
export declare const disable2FASchema: z.ZodObject<{
    password: z.ZodString;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const resendVerificationSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const sessionInfoSchema: z.ZodObject<{
    deviceInfo: z.ZodOptional<z.ZodObject<{
        userAgent: z.ZodOptional<z.ZodString>;
        ip: z.ZodOptional<z.ZodString>;
        device: z.ZodOptional<z.ZodString>;
        browser: z.ZodOptional<z.ZodString>;
        os: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        ip?: string | undefined;
        userAgent?: string | undefined;
        device?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
    }, {
        ip?: string | undefined;
        userAgent?: string | undefined;
        device?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    deviceInfo?: {
        ip?: string | undefined;
        userAgent?: string | undefined;
        device?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
    } | undefined;
}, {
    deviceInfo?: {
        ip?: string | undefined;
        userAgent?: string | undefined;
        device?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
    } | undefined;
}>;
export declare const inviteUserSchema: z.ZodObject<{
    email: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<[string, string, string, string, string]>>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    expiresIn: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: string;
    expiresIn: number;
    message?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    email: string;
    message?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: string | undefined;
    expiresIn?: number | undefined;
}>;
export declare const acceptInvitationSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    confirmPassword: string;
    token: string;
    firstName: string;
    lastName: string;
    acceptTerms: boolean;
    phone?: string | undefined;
}, {
    password: string;
    confirmPassword: string;
    token: string;
    firstName: string;
    lastName: string;
    acceptTerms: boolean;
    phone?: string | undefined;
}>, {
    password: string;
    confirmPassword: string;
    token: string;
    firstName: string;
    lastName: string;
    acceptTerms: boolean;
    phone?: string | undefined;
}, {
    password: string;
    confirmPassword: string;
    token: string;
    firstName: string;
    lastName: string;
    acceptTerms: boolean;
    phone?: string | undefined;
}>;
export declare const deleteAccountSchema: z.ZodObject<{
    password: z.ZodString;
    confirmation: z.ZodEffects<z.ZodString, "DELETE", string>;
    feedback: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password: string;
    confirmation: "DELETE";
    feedback?: string | undefined;
}, {
    password: string;
    confirmation: string;
    feedback?: string | undefined;
}>;
export declare const loginResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<[string, string, string, string, string]>;
        status: z.ZodEnum<[string, string, string, string]>;
        avatar: z.ZodOptional<z.ZodString>;
        lastLoginAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        avatar?: string | undefined;
        lastLoginAt?: string | undefined;
    }, {
        id: string;
        status: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        avatar?: string | undefined;
        lastLoginAt?: string | undefined;
    }>;
    tokens: z.ZodObject<{
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
        expiresIn: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        refreshToken: string;
        accessToken: string;
        expiresIn: number;
    }, {
        refreshToken: string;
        accessToken: string;
        expiresIn: number;
    }>;
    tenant: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        slug: string;
    }, {
        id: string;
        name: string;
        slug: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        status: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        avatar?: string | undefined;
        lastLoginAt?: string | undefined;
    };
    tokens: {
        refreshToken: string;
        accessToken: string;
        expiresIn: number;
    };
    tenant?: {
        id: string;
        name: string;
        slug: string;
    } | undefined;
}, {
    user: {
        id: string;
        status: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        avatar?: string | undefined;
        lastLoginAt?: string | undefined;
    };
    tokens: {
        refreshToken: string;
        accessToken: string;
        expiresIn: number;
    };
    tenant?: {
        id: string;
        name: string;
        slug: string;
    } | undefined;
}>;
export declare const userResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<[string, string, string, string, string]>;
    status: z.ZodEnum<[string, string, string, string]>;
    phone: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    lastLoginAt: z.ZodOptional<z.ZodString>;
    emailVerifiedAt: z.ZodOptional<z.ZodString>;
    twoFactorEnabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    twoFactorEnabled: boolean;
    phone?: string | undefined;
    company?: string | undefined;
    position?: string | undefined;
    avatar?: string | undefined;
    lastLoginAt?: string | undefined;
    location?: string | undefined;
    bio?: string | undefined;
    website?: string | undefined;
    emailVerifiedAt?: string | undefined;
}, {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    twoFactorEnabled: boolean;
    phone?: string | undefined;
    company?: string | undefined;
    position?: string | undefined;
    avatar?: string | undefined;
    lastLoginAt?: string | undefined;
    location?: string | undefined;
    bio?: string | undefined;
    website?: string | undefined;
    emailVerifiedAt?: string | undefined;
}>;
declare const _default: {
    userRoleSchema: z.ZodEnum<[string, string, string, string, string]>;
    userStatusSchema: z.ZodEnum<[string, string, string, string]>;
    loginSchema: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        workspace: z.ZodOptional<z.ZodString>;
        rememberMe: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
        rememberMe: boolean;
        workspace?: string | undefined;
    }, {
        password: string;
        email: string;
        workspace?: string | undefined;
        rememberMe?: boolean | undefined;
    }>;
    registerSchema: z.ZodEffects<z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        confirmPassword: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        workspace: z.ZodOptional<z.ZodString>;
        acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        confirmPassword: string;
        firstName: string;
        lastName: string;
        email: string;
        acceptTerms: boolean;
        phone?: string | undefined;
        workspace?: string | undefined;
    }, {
        password: string;
        confirmPassword: string;
        firstName: string;
        lastName: string;
        email: string;
        acceptTerms: boolean;
        phone?: string | undefined;
        workspace?: string | undefined;
    }>, {
        password: string;
        confirmPassword: string;
        firstName: string;
        lastName: string;
        email: string;
        acceptTerms: boolean;
        phone?: string | undefined;
        workspace?: string | undefined;
    }, {
        password: string;
        confirmPassword: string;
        firstName: string;
        lastName: string;
        email: string;
        acceptTerms: boolean;
        phone?: string | undefined;
        workspace?: string | undefined;
    }>;
    passwordResetRequestSchema: z.ZodObject<{
        email: z.ZodString;
        workspace: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        workspace?: string | undefined;
    }, {
        email: string;
        workspace?: string | undefined;
    }>;
    passwordResetSchema: z.ZodEffects<z.ZodObject<{
        token: z.ZodString;
        password: z.ZodString;
        confirmPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
        confirmPassword: string;
        token: string;
    }, {
        password: string;
        confirmPassword: string;
        token: string;
    }>, {
        password: string;
        confirmPassword: string;
        token: string;
    }, {
        password: string;
        confirmPassword: string;
        token: string;
    }>;
    changePasswordSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
        confirmPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        confirmPassword: string;
        currentPassword: string;
        newPassword: string;
    }, {
        confirmPassword: string;
        currentPassword: string;
        newPassword: string;
    }>, {
        confirmPassword: string;
        currentPassword: string;
        newPassword: string;
    }, {
        confirmPassword: string;
        currentPassword: string;
        newPassword: string;
    }>, {
        confirmPassword: string;
        currentPassword: string;
        newPassword: string;
    }, {
        confirmPassword: string;
        currentPassword: string;
        newPassword: string;
    }>;
    updateProfileSchema: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
        company: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        phone?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        company?: string | undefined;
        position?: string | undefined;
        avatar?: string | undefined;
        location?: string | undefined;
        bio?: string | undefined;
        website?: string | undefined;
    }, {
        phone?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        company?: string | undefined;
        position?: string | undefined;
        avatar?: string | undefined;
        location?: string | undefined;
        bio?: string | undefined;
        website?: string | undefined;
    }>;
    createUserSchema: z.ZodObject<{
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<[string, string, string, string, string]>;
        phone: z.ZodOptional<z.ZodString>;
        tenantId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodString>;
        sendInvite: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        sendInvite: boolean;
        tenantId?: string | undefined;
        phone?: string | undefined;
        clientId?: string | undefined;
    }, {
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        tenantId?: string | undefined;
        phone?: string | undefined;
        clientId?: string | undefined;
        sendInvite?: boolean | undefined;
    }>;
    updateUserSchema: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodEnum<[string, string, string, string, string]>>;
        status: z.ZodOptional<z.ZodEnum<[string, string, string, string]>>;
        avatar: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
        company: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        phone?: string | undefined;
        status?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        email?: string | undefined;
        company?: string | undefined;
        position?: string | undefined;
        avatar?: string | undefined;
        role?: string | undefined;
        location?: string | undefined;
        bio?: string | undefined;
        website?: string | undefined;
    }, {
        phone?: string | undefined;
        status?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        email?: string | undefined;
        company?: string | undefined;
        position?: string | undefined;
        avatar?: string | undefined;
        role?: string | undefined;
        location?: string | undefined;
        bio?: string | undefined;
        website?: string | undefined;
    }>;
    userFiltersSchema: z.ZodObject<{
        role: z.ZodOptional<z.ZodArray<z.ZodEnum<[string, string, string, string, string]>, "many">>;
        status: z.ZodOptional<z.ZodArray<z.ZodEnum<[string, string, string, string]>, "many">>;
        tenantId: z.ZodOptional<z.ZodString>;
        clientId: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        createdAfter: z.ZodOptional<z.ZodString>;
        createdBefore: z.ZodOptional<z.ZodString>;
        lastLoginAfter: z.ZodOptional<z.ZodString>;
        lastLoginBefore: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        search?: string | undefined;
        tenantId?: string | undefined;
        clientId?: string | undefined;
        status?: string[] | undefined;
        email?: string | undefined;
        role?: string[] | undefined;
        createdAfter?: string | undefined;
        createdBefore?: string | undefined;
        lastLoginAfter?: string | undefined;
        lastLoginBefore?: string | undefined;
    }, {
        search?: string | undefined;
        tenantId?: string | undefined;
        clientId?: string | undefined;
        status?: string[] | undefined;
        email?: string | undefined;
        role?: string[] | undefined;
        createdAfter?: string | undefined;
        createdBefore?: string | undefined;
        lastLoginAfter?: string | undefined;
        lastLoginBefore?: string | undefined;
    }>;
    refreshTokenSchema: z.ZodObject<{
        refreshToken: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        refreshToken: string;
    }, {
        refreshToken: string;
    }>;
    logoutSchema: z.ZodObject<{
        everywhere: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        everywhere: boolean;
    }, {
        everywhere?: boolean | undefined;
    }>;
    enable2FASchema: z.ZodObject<{
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
    }, {
        password: string;
    }>;
    verify2FASchema: z.ZodObject<{
        token: z.ZodString;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        token: string;
        code: string;
    }, {
        token: string;
        code: string;
    }>;
    disable2FASchema: z.ZodObject<{
        password: z.ZodString;
        token: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
        token: string;
    }, {
        password: string;
        token: string;
    }>;
    verifyEmailSchema: z.ZodObject<{
        token: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        token: string;
    }, {
        token: string;
    }>;
    resendVerificationSchema: z.ZodObject<{
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
    }, {
        email: string;
    }>;
    sessionInfoSchema: z.ZodObject<{
        deviceInfo: z.ZodOptional<z.ZodObject<{
            userAgent: z.ZodOptional<z.ZodString>;
            ip: z.ZodOptional<z.ZodString>;
            device: z.ZodOptional<z.ZodString>;
            browser: z.ZodOptional<z.ZodString>;
            os: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            ip?: string | undefined;
            userAgent?: string | undefined;
            device?: string | undefined;
            browser?: string | undefined;
            os?: string | undefined;
        }, {
            ip?: string | undefined;
            userAgent?: string | undefined;
            device?: string | undefined;
            browser?: string | undefined;
            os?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        deviceInfo?: {
            ip?: string | undefined;
            userAgent?: string | undefined;
            device?: string | undefined;
            browser?: string | undefined;
            os?: string | undefined;
        } | undefined;
    }, {
        deviceInfo?: {
            ip?: string | undefined;
            userAgent?: string | undefined;
            device?: string | undefined;
            browser?: string | undefined;
            os?: string | undefined;
        } | undefined;
    }>;
    inviteUserSchema: z.ZodObject<{
        email: z.ZodString;
        role: z.ZodDefault<z.ZodEnum<[string, string, string, string, string]>>;
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        expiresIn: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        role: string;
        expiresIn: number;
        message?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
    }, {
        email: string;
        message?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        role?: string | undefined;
        expiresIn?: number | undefined;
    }>;
    acceptInvitationSchema: z.ZodEffects<z.ZodObject<{
        token: z.ZodString;
        password: z.ZodString;
        confirmPassword: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        confirmPassword: string;
        token: string;
        firstName: string;
        lastName: string;
        acceptTerms: boolean;
        phone?: string | undefined;
    }, {
        password: string;
        confirmPassword: string;
        token: string;
        firstName: string;
        lastName: string;
        acceptTerms: boolean;
        phone?: string | undefined;
    }>, {
        password: string;
        confirmPassword: string;
        token: string;
        firstName: string;
        lastName: string;
        acceptTerms: boolean;
        phone?: string | undefined;
    }, {
        password: string;
        confirmPassword: string;
        token: string;
        firstName: string;
        lastName: string;
        acceptTerms: boolean;
        phone?: string | undefined;
    }>;
    deleteAccountSchema: z.ZodObject<{
        password: z.ZodString;
        confirmation: z.ZodEffects<z.ZodString, "DELETE", string>;
        feedback: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        password: string;
        confirmation: "DELETE";
        feedback?: string | undefined;
    }, {
        password: string;
        confirmation: string;
        feedback?: string | undefined;
    }>;
    loginResponseSchema: z.ZodObject<{
        user: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            firstName: z.ZodString;
            lastName: z.ZodString;
            role: z.ZodEnum<[string, string, string, string, string]>;
            status: z.ZodEnum<[string, string, string, string]>;
            avatar: z.ZodOptional<z.ZodString>;
            lastLoginAt: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            status: string;
            firstName: string;
            lastName: string;
            email: string;
            role: string;
            avatar?: string | undefined;
            lastLoginAt?: string | undefined;
        }, {
            id: string;
            status: string;
            firstName: string;
            lastName: string;
            email: string;
            role: string;
            avatar?: string | undefined;
            lastLoginAt?: string | undefined;
        }>;
        tokens: z.ZodObject<{
            accessToken: z.ZodString;
            refreshToken: z.ZodString;
            expiresIn: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            refreshToken: string;
            accessToken: string;
            expiresIn: number;
        }, {
            refreshToken: string;
            accessToken: string;
            expiresIn: number;
        }>;
        tenant: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            slug: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            slug: string;
        }, {
            id: string;
            name: string;
            slug: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        user: {
            id: string;
            status: string;
            firstName: string;
            lastName: string;
            email: string;
            role: string;
            avatar?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        tokens: {
            refreshToken: string;
            accessToken: string;
            expiresIn: number;
        };
        tenant?: {
            id: string;
            name: string;
            slug: string;
        } | undefined;
    }, {
        user: {
            id: string;
            status: string;
            firstName: string;
            lastName: string;
            email: string;
            role: string;
            avatar?: string | undefined;
            lastLoginAt?: string | undefined;
        };
        tokens: {
            refreshToken: string;
            accessToken: string;
            expiresIn: number;
        };
        tenant?: {
            id: string;
            name: string;
            slug: string;
        } | undefined;
    }>;
    userResponseSchema: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<[string, string, string, string, string]>;
        status: z.ZodEnum<[string, string, string, string]>;
        phone: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
        company: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        lastLoginAt: z.ZodOptional<z.ZodString>;
        emailVerifiedAt: z.ZodOptional<z.ZodString>;
        twoFactorEnabled: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        twoFactorEnabled: boolean;
        phone?: string | undefined;
        company?: string | undefined;
        position?: string | undefined;
        avatar?: string | undefined;
        lastLoginAt?: string | undefined;
        location?: string | undefined;
        bio?: string | undefined;
        website?: string | undefined;
        emailVerifiedAt?: string | undefined;
    }, {
        id: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        twoFactorEnabled: boolean;
        phone?: string | undefined;
        company?: string | undefined;
        position?: string | undefined;
        avatar?: string | undefined;
        lastLoginAt?: string | undefined;
        location?: string | undefined;
        bio?: string | undefined;
        website?: string | undefined;
        emailVerifiedAt?: string | undefined;
    }>;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map