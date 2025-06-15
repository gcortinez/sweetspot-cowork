import { TenantStatus } from "@sweetspot/shared";
export interface CreateTenantRequest {
    name: string;
    slug: string;
    domain?: string;
    logo?: string;
    description?: string;
    settings?: Record<string, any>;
    adminUser: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    };
}
export interface UpdateTenantRequest {
    name?: string;
    slug?: string;
    domain?: string;
    logo?: string;
    description?: string;
    settings?: Record<string, any>;
    status?: TenantStatus;
}
export interface TenantResponse {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    logo?: string;
    description?: string;
    settings?: Record<string, any>;
    status: TenantStatus;
    createdAt: string;
    updatedAt: string;
    userCount?: number;
    clientCount?: number;
}
export declare class TenantService {
    static createTenant(data: CreateTenantRequest): Promise<TenantResponse>;
    static getTenantById(tenantId: string): Promise<TenantResponse | null>;
    static getTenantBySlug(slug: string): Promise<TenantResponse | null>;
    static getTenantByDomain(domain: string): Promise<TenantResponse | null>;
    static getAllTenants(page?: number, limit?: number, status?: TenantStatus): Promise<{
        tenants: TenantResponse[];
        total: number;
        page: number;
        limit: number;
    }>;
    static updateTenant(tenantId: string, data: UpdateTenantRequest): Promise<TenantResponse>;
    static deleteTenant(tenantId: string, hardDelete?: boolean): Promise<void>;
    static suspendTenant(tenantId: string): Promise<TenantResponse>;
    static activateTenant(tenantId: string): Promise<TenantResponse>;
    static getTenantStats(tenantId: string): Promise<{
        userCount: number;
        clientCount: number;
        activeBookings: number;
        totalRevenue: number;
        spacesCount: number;
    }>;
    static validateSlug(slug: string): boolean;
    static generateSlugFromName(name: string): Promise<string>;
}
//# sourceMappingURL=tenantService.d.ts.map