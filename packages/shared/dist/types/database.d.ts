export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    domain: string | null;
                    logo: string | null;
                    description: string | null;
                    settings: any | null;
                    status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
                    createdAt: string;
                    updatedAt: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    domain?: string | null;
                    logo?: string | null;
                    description?: string | null;
                    settings?: any | null;
                    status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";
                    createdAt?: string;
                    updatedAt?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    domain?: string | null;
                    logo?: string | null;
                    description?: string | null;
                    settings?: any | null;
                    status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";
                    createdAt?: string;
                    updatedAt?: string;
                };
            };
            users: {
                Row: {
                    id: string;
                    tenantId: string;
                    supabaseId: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                    avatar: string | null;
                    role: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
                    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
                    lastLoginAt: string | null;
                    clientId: string | null;
                    createdAt: string;
                    updatedAt: string;
                };
                Insert: {
                    id?: string;
                    tenantId: string;
                    supabaseId: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                    phone?: string | null;
                    avatar?: string | null;
                    role: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
                    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
                    lastLoginAt?: string | null;
                    clientId?: string | null;
                    createdAt?: string;
                    updatedAt?: string;
                };
                Update: {
                    id?: string;
                    tenantId?: string;
                    supabaseId?: string;
                    email?: string;
                    firstName?: string;
                    lastName?: string;
                    phone?: string | null;
                    avatar?: string | null;
                    role?: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
                    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
                    lastLoginAt?: string | null;
                    clientId?: string | null;
                    createdAt?: string;
                    updatedAt?: string;
                };
            };
            clients: {
                Row: {
                    id: string;
                    tenantId: string;
                    name: string;
                    email: string;
                    phone: string | null;
                    address: string | null;
                    taxId: string | null;
                    contactPerson: string | null;
                    status: "LEAD" | "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED";
                    notes: string | null;
                    createdAt: string;
                    updatedAt: string;
                };
                Insert: {
                    id?: string;
                    tenantId: string;
                    name: string;
                    email: string;
                    phone?: string | null;
                    address?: string | null;
                    taxId?: string | null;
                    contactPerson?: string | null;
                    status?: "LEAD" | "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED";
                    notes?: string | null;
                    createdAt?: string;
                    updatedAt?: string;
                };
                Update: {
                    id?: string;
                    tenantId?: string;
                    name?: string;
                    email?: string;
                    phone?: string | null;
                    address?: string | null;
                    taxId?: string | null;
                    contactPerson?: string | null;
                    status?: "LEAD" | "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED";
                    notes?: string | null;
                    createdAt?: string;
                    updatedAt?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            TenantStatus: "ACTIVE" | "SUSPENDED" | "INACTIVE";
            UserRole: "SUPER_ADMIN" | "COWORK_ADMIN" | "CLIENT_ADMIN" | "END_USER";
            UserStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
            ClientStatus: "LEAD" | "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
export type Tenant = Tables<"tenants">;
export type User = Tables<"users">;
export type Client = Tables<"clients">;
export type TenantStatus = Enums<"TenantStatus">;
export type UserRole = Enums<"UserRole">;
export type UserStatus = Enums<"UserStatus">;
export type ClientStatus = Enums<"ClientStatus">;
export type TenantInsert = Database["public"]["Tables"]["tenants"]["Insert"];
export type TenantUpdate = Database["public"]["Tables"]["tenants"]["Update"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T = any> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export interface AuthUser {
    id: string;
    email: string;
    tenantId: string | null;
    role: UserRole;
    clientId?: string;
}
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
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface ResetPasswordRequest {
    email: string;
    tenantSlug: string;
}
export interface ConfirmResetPasswordRequest {
    token: string;
    newPassword: string;
}
export interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    fieldErrors?: Record<string, string>;
    details?: any;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T = any> extends ApiResponse<{
    items: T[];
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}> {
}
//# sourceMappingURL=database.d.ts.map