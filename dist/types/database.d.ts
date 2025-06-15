export * from "@sweetspot/shared";
import { User, Tenant, Workspace, Space, Booking, Membership, Payment, Prisma } from "@prisma/client";
export type UserWithRelations = User & {
    tenant?: Tenant;
    memberships?: Membership[];
    bookings?: Booking[];
    createdSpaces?: Space[];
    payments?: Payment[];
};
export type TenantWithRelations = Tenant & {
    users?: User[];
    workspaces?: Workspace[];
    subscriptions?: any[];
    billingInfo?: any;
};
export type WorkspaceWithRelations = Workspace & {
    tenant?: Tenant;
    spaces?: Space[];
    memberships?: Membership[];
    bookings?: Booking[];
};
export type SpaceWithRelations = Space & {
    workspace?: Workspace;
    bookings?: Booking[];
    amenities?: any[];
    reviews?: any[];
};
export type BookingWithRelations = Booking & {
    user?: User;
    space?: SpaceWithRelations;
    workspace?: Workspace;
    payments?: Payment[];
};
export type MembershipWithRelations = Membership & {
    user?: User;
    workspace?: Workspace;
    plan?: any;
};
export interface QueryOptions {
    include?: Prisma.UserInclude | Prisma.TenantInclude | any;
    select?: Prisma.UserSelect | Prisma.TenantSelect | any;
    where?: Prisma.UserWhereInput | Prisma.TenantWhereInput | any;
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.TenantOrderByWithRelationInput | any;
    take?: number;
    skip?: number;
}
export interface DateRangeFilter {
    from?: Date;
    to?: Date;
}
export interface UserFilters {
    role?: string[];
    status?: string[];
    tenantId?: string;
    email?: string;
    createdAt?: DateRangeFilter;
    lastLoginAt?: DateRangeFilter;
}
export interface SpaceFilters {
    type?: string[];
    status?: string[];
    workspaceId?: string;
    capacity?: {
        min?: number;
        max?: number;
    };
    priceRange?: {
        min?: number;
        max?: number;
    };
    amenities?: string[];
    available?: boolean;
}
export interface BookingFilters {
    status?: string[];
    userId?: string;
    spaceId?: string;
    workspaceId?: string;
    startDate?: DateRangeFilter;
    endDate?: DateRangeFilter;
    dateRange?: DateRangeFilter;
}
export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersByRole: Record<string, number>;
    usersByStatus: Record<string, number>;
}
export interface SpaceStats {
    totalSpaces: number;
    availableSpaces: number;
    occupiedSpaces: number;
    spacesByType: Record<string, number>;
    averageOccupancy: number;
}
export interface BookingStats {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageBookingDuration: number;
    bookingsByStatus: Record<string, number>;
}
export interface WorkspaceStats {
    totalWorkspaces: number;
    activeWorkspaces: number;
    totalSpaces: number;
    totalMembers: number;
    totalRevenue: number;
    occupancyRate: number;
}
export interface SearchOptions {
    query: string;
    fields?: string[];
    filters?: Record<string, any>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export interface SearchResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface AuditLog {
    id: string;
    userId?: string;
    tenantId?: string;
    action: string;
    resource: string;
    resourceId: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export interface ActivityEvent {
    id: string;
    userId?: string;
    tenantId?: string;
    type: string;
    description: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}
export interface BaseRepository<T> {
    findById(id: string, options?: QueryOptions): Promise<T | null>;
    findMany(options?: QueryOptions): Promise<T[]>;
    create(data: any): Promise<T>;
    update(id: string, data: any): Promise<T>;
    delete(id: string): Promise<void>;
    count(where?: any): Promise<number>;
    exists(where: any): Promise<boolean>;
}
export interface PaginatedRepository<T> extends BaseRepository<T> {
    findPaginated(page: number, limit: number, options?: QueryOptions): Promise<{
        data: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
}
export interface TenantAwareRepository<T> extends PaginatedRepository<T> {
    findByTenant(tenantId: string, options?: QueryOptions): Promise<T[]>;
    findByIdAndTenant(id: string, tenantId: string, options?: QueryOptions): Promise<T | null>;
    createForTenant(tenantId: string, data: any): Promise<T>;
    updateForTenant(id: string, tenantId: string, data: any): Promise<T>;
    deleteForTenant(id: string, tenantId: string): Promise<void>;
    countByTenant(tenantId: string, where?: any): Promise<number>;
}
export type TransactionClient = Prisma.TransactionClient;
export interface TransactionOptions {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
}
export interface BackupInfo {
    id: string;
    filename: string;
    size: number;
    createdAt: Date;
    type: 'full' | 'incremental';
    status: 'pending' | 'completed' | 'failed';
    metadata?: Record<string, any>;
}
export interface MigrationInfo {
    id: string;
    name: string;
    appliedAt: Date;
    executionTime: number;
    checksum: string;
}
export interface QueryPerformance {
    query: string;
    averageExecutionTime: number;
    totalExecutions: number;
    slowestExecution: number;
    lastExecuted: Date;
}
export interface DatabaseMetrics {
    connectionCount: number;
    activeQueries: number;
    queryStats: {
        total: number;
        successful: number;
        failed: number;
        averageTime: number;
    };
    tableStats: Record<string, {
        rowCount: number;
        size: string;
        indexCount: number;
    }>;
}
export interface DatabaseConfig {
    enableQueryLogging: boolean;
    enableSlowQueryLogging: boolean;
    slowQueryThreshold: number;
    enableMetrics: boolean;
    enableAuditLogging: boolean;
    connectionPool: {
        min: number;
        max: number;
        idleTimeout: number;
    };
}
declare const _default: {
    UserWithRelations: any;
    TenantWithRelations: any;
    WorkspaceWithRelations: any;
    SpaceWithRelations: any;
    BookingWithRelations: any;
    MembershipWithRelations: any;
};
export default _default;
//# sourceMappingURL=database.d.ts.map