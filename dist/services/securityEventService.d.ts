import { SecurityEventType, SecuritySeverity } from '@prisma/client';
export interface SecurityEventData {
    tenantId: string;
    eventType: SecurityEventType;
    severity?: SecuritySeverity;
    source?: string;
    ipAddress?: string;
    userAgent?: string;
    performedById?: string;
    targetUserId?: string;
    description: string;
    metadata?: Record<string, any>;
}
export interface SecurityEventQuery {
    tenantId: string;
    eventType?: SecurityEventType;
    severity?: SecuritySeverity;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
    performedById?: string;
    targetUserId?: string;
    limit?: number;
    offset?: number;
}
export declare class SecurityEventService {
    logEvent(data: SecurityEventData): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    query(params: SecurityEventQuery): Promise<({
        performedBy: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
        targetUser: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    })[]>;
    resolveEvent(eventId: string, resolvedBy: string, tenantId: string): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    getStatistics(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
        totalEvents: number;
        unresolvedEvents: number;
        severityStats: {
            severity: import(".prisma/client").$Enums.SecuritySeverity;
            count: number;
        }[];
        typeStats: {
            eventType: import(".prisma/client").$Enums.SecurityEventType;
            count: number;
        }[];
        recentCritical: {
            timestamp: Date;
            userAgent: string | null;
            tenantId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            id: string;
            source: string | null;
            description: string;
            severity: import(".prisma/client").$Enums.SecuritySeverity;
            resolved: boolean;
            resolvedBy: string | null;
            resolvedAt: Date | null;
            ipAddress: string | null;
            eventType: import(".prisma/client").$Enums.SecurityEventType;
            performedById: string | null;
            targetUserId: string | null;
        }[];
    }>;
    logFailedLogin(tenantId: string, email: string, ipAddress?: string, userAgent?: string, reason?: string): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    logMultipleFailedLogins(tenantId: string, email: string, attemptCount: number, ipAddress?: string, userAgent?: string): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    logSuccessfulLogin(tenantId: string, userId: string, ipAddress?: string, userAgent?: string, loginMethod?: string): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    logSuspiciousLogin(tenantId: string, userId: string, reason: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    logUnauthorizedAccess(tenantId: string, resource: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    logPrivilegeEscalation(tenantId: string, userId: string, attemptedAction: string, ipAddress?: string, userAgent?: string): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    logDataExport(tenantId: string, userId: string, dataType: string, recordCount: number, ipAddress?: string, userAgent?: string): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    logRateLimitExceeded(tenantId: string, endpoint: string, ipAddress?: string, userAgent?: string, userId?: string): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    logAdminAction(tenantId: string, adminUserId: string, action: string, targetUserId?: string, ipAddress?: string, userAgent?: string, metadata?: Record<string, any>): Promise<{
        timestamp: Date;
        userAgent: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        source: string | null;
        description: string;
        severity: import(".prisma/client").$Enums.SecuritySeverity;
        resolved: boolean;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        ipAddress: string | null;
        eventType: import(".prisma/client").$Enums.SecurityEventType;
        performedById: string | null;
        targetUserId: string | null;
    }>;
    detectThreats(tenantId: string, lookbackHours?: number): Promise<({
        type: string;
        severity: string;
        description: string;
        details: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.SecurityEventGroupByOutputType, "ipAddress"[]> & {
            _count: {
                ipAddress: number;
            };
        })[];
        count?: undefined;
    } | {
        type: string;
        severity: string;
        description: string;
        count: number;
        details?: undefined;
    })[]>;
}
export declare const securityEventService: SecurityEventService;
//# sourceMappingURL=securityEventService.d.ts.map