import { AuditAction } from '@prisma/client';
export interface AuditLogData {
    tenantId: string;
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    details?: Record<string, any>;
}
export interface AuditLogQuery {
    tenantId: string;
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
    limit?: number;
    offset?: number;
}
export declare class AuditLogService {
    log(data: AuditLogData): Promise<void>;
    query(params: AuditLogQuery): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        timestamp: Date;
        requestId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        userAgent: string | null;
        userId: string | null;
        tenantId: string;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        action: import(".prisma/client").$Enums.AuditAction;
        entityType: string;
        entityId: string | null;
        ipAddress: string | null;
    })[]>;
    getStatistics(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
        totalLogs: number;
        actionStats: {
            action: import(".prisma/client").$Enums.AuditAction;
            count: number;
        }[];
        userStats: {
            userId: string | null;
            count: number;
        }[];
        entityStats: {
            entityType: string;
            count: number;
        }[];
    }>;
    logAuthentication(tenantId: string, userId: string, action: 'LOGIN' | 'LOGOUT', ipAddress?: string, userAgent?: string, details?: Record<string, any>): Promise<void>;
    logDataChange(tenantId: string, userId: string, action: 'CREATE' | 'UPDATE' | 'DELETE', entityType: string, entityId: string, oldValues?: Record<string, any>, newValues?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    logSecurityEvent(tenantId: string, userId: string, action: AuditAction, description: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>): Promise<void>;
    cleanupOldLogs(tenantId: string, olderThanDays?: number): Promise<number>;
    exportLogs(params: AuditLogQuery): Promise<{
        id: string;
        timestamp: string;
        user: string;
        action: import(".prisma/client").$Enums.AuditAction;
        entityType: string;
        entityId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue;
        oldValues: import("@prisma/client/runtime/library").JsonValue;
        newValues: import("@prisma/client/runtime/library").JsonValue;
        ipAddress: string | null;
        userAgent: string | null;
    }[]>;
}
export declare const auditLogService: AuditLogService;
//# sourceMappingURL=auditLogService.d.ts.map