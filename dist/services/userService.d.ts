import { UserRole, UserStatus } from "@sweetspot/shared";
export interface CreateUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    role: UserRole;
    phone?: string;
    avatar?: string;
    clientId?: string;
}
export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    role?: UserRole;
    status?: UserStatus;
    clientId?: string;
}
export interface UserResponse {
    id: string;
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt?: string;
    clientId?: string;
    createdAt: string;
    updatedAt: string;
    fullName?: string;
    tenant?: {
        id: string;
        name: string;
        slug: string;
    };
    client?: {
        id: string;
        name: string;
    };
}
export declare class UserService {
    static createUser(data: CreateUserRequest): Promise<UserResponse>;
    static getUserById(userId: string): Promise<UserResponse | null>;
    static getUserByEmail(email: string, tenantId: string): Promise<UserResponse | null>;
    static getUsersByTenant(tenantId: string, page?: number, limit?: number, role?: UserRole, status?: UserStatus, clientId?: string): Promise<{
        users: UserResponse[];
        total: number;
        page: number;
        limit: number;
    }>;
    static updateUser(userId: string, data: UpdateUserRequest): Promise<UserResponse>;
    static updateLastLogin(userId: string): Promise<void>;
    static deleteUser(userId: string, hardDelete?: boolean): Promise<void>;
    static suspendUser(userId: string): Promise<UserResponse>;
    static activateUser(userId: string): Promise<UserResponse>;
    static getUserStats(tenantId: string): Promise<{
        totalUsers: number;
        activeUsers: number;
        suspendedUsers: number;
        inactiveUsers: number;
        usersByRole: Record<UserRole, number>;
        recentLogins: number;
    }>;
    private static formatUserResponse;
}
//# sourceMappingURL=userService.d.ts.map