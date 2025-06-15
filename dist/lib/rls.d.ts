import { UserRole } from "@sweetspot/shared";
export interface TenantContext {
    tenantId: string;
    userId: string;
    role: UserRole;
    clientId?: string;
}
export declare const getTenantContext: (accessToken: string) => Promise<TenantContext | null>;
export declare const createTenantClient: (accessToken: string, tenantContext: TenantContext) => import("@supabase/supabase-js").SupabaseClient<import("@sweetspot/shared").Database, "public", any>;
export declare const validateTenantAccess: (userContext: TenantContext, targetTenantId: string) => boolean;
export declare const isAdmin: (role: UserRole) => boolean;
export declare const canManageClients: (role: UserRole) => boolean;
export declare const canManageUsers: (role: UserRole) => boolean;
export declare const canViewFinancials: (role: UserRole) => boolean;
export declare const canMakeBookings: (role: UserRole) => boolean;
export declare const getAllowedTenantIds: (accessToken: string) => Promise<string[]>;
export declare const withTenantContext: (accessToken: string, callback: (context: TenantContext) => Promise<any>) => Promise<any>;
export declare const setUserMetadata: (userId: string, tenantId: string, role: UserRole, clientId?: string) => Promise<boolean>;
export declare const createUserWithTenant: (email: string, password: string, tenantId: string, role: UserRole, firstName: string, lastName: string, clientId?: string) => Promise<{
    authUser: import("@supabase/auth-js").User;
    userRecord: any;
} | null>;
export declare const deleteUserWithCleanup: (userId: string) => Promise<boolean>;
export declare const testRLSPolicies: (accessToken: string) => Promise<{
    context: TenantContext;
    tests: {
        tenants: {
            data: {
                id: any;
                name: any;
            }[] | null;
            error: import("@supabase/postgrest-js").PostgrestError | null;
        };
        users: {
            data: {
                id: any;
                email: any;
                role: any;
            }[] | null;
            error: import("@supabase/postgrest-js").PostgrestError | null;
        };
        clients: {
            data: {
                id: any;
                name: any;
                status: any;
            }[] | null;
            error: import("@supabase/postgrest-js").PostgrestError | null;
        };
    };
}>;
//# sourceMappingURL=rls.d.ts.map