import { UserRole } from "@sweetspot/shared";
export interface LoginRequest {
    email: string;
    password: string;
    tenantSlug?: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantSlug: string;
    role?: UserRole;
    clientId?: string;
}
export interface AuthUser {
    id: string;
    email: string;
    tenantId: string;
    role: UserRole;
    clientId?: string;
}
export interface LoginResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tenant: {
        id: string;
        name: string;
        slug: string;
    };
}
export interface RegisterResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tenant: {
        id: string;
        name: string;
        slug: string;
    };
}
export interface SessionInfo {
    user: AuthUser;
    tenant: {
        id: string;
        name: string;
        slug: string;
    };
    isValid: boolean;
}
export declare class AuthService {
    static login(email: string, password: string, tenantSlug?: string): Promise<{
        success: boolean;
        user?: AuthUser;
        tenant?: {
            id: string;
            name: string;
            slug: string;
        };
        tenants?: Array<{
            id: string;
            name: string;
            slug: string;
        }>;
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: string;
        error?: string;
    }>;
    static register(data: RegisterRequest): Promise<{
        success: boolean;
        user?: AuthUser;
        tenant?: {
            id: string;
            name: string;
            slug: string;
        };
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: string;
        error?: string;
    }>;
    static logout(accessToken: string): Promise<void>;
    static refreshToken(refreshToken: string): Promise<{
        success: boolean;
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: string;
        error?: string;
    }>;
    static getSession(accessToken: string): Promise<SessionInfo>;
    static verifyPermissions(userId: string, action: string, resource: string, resourceId?: string): Promise<boolean>;
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    static resetPassword(email: string, tenantSlug: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    static confirmResetPassword(token: string, newPassword: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=authService.d.ts.map