import { ActivityType } from '@prisma/client';
interface CreateActivityData {
    type: ActivityType;
    subject: string;
    description?: string;
    clientId?: string;
    leadId?: string;
    opportunityId?: string;
    dueDate?: string;
    duration?: number;
    location?: string;
    metadata?: Record<string, any>;
    outcome?: string;
    completedAt?: string;
}
interface UpdateActivityData extends Partial<CreateActivityData> {
}
interface ActivityQuery {
    page: number;
    limit: number;
    search?: string;
    type?: ActivityType;
    clientId?: string;
    leadId?: string;
    opportunityId?: string;
    userId?: string;
    completed?: boolean;
    overdue?: boolean;
    dateFrom?: string;
    dateTo?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface BulkActionData {
    activityIds: string[];
    action: 'complete' | 'delete' | 'assign';
    assignedToId?: string;
    completedAt?: string;
}
interface ActivityStats {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    byType: Record<ActivityType, number>;
    byUser: Array<{
        userId: string;
        userName: string;
        total: number;
        completed: number;
        pending: number;
    }>;
    completionRate: number;
    averageDuration: number;
    upcomingThisWeek: number;
}
interface TimelineQuery {
    clientId?: string;
    leadId?: string;
    opportunityId?: string;
    days: number;
}
declare class ActivityService {
    getActivities(tenantId: string, query: ActivityQuery): Promise<{
        activities: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            };
            client: {
                id: string;
                email: string;
                name: string;
            } | null;
            lead: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            } | null;
            opportunity: {
                value: import("@prisma/client/runtime/library").Decimal;
                id: string;
                title: string;
                stage: import(".prisma/client").$Enums.PipelineStage;
            } | null;
        } & {
            userId: string;
            tenantId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            clientId: string | null;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            type: import(".prisma/client").$Enums.ActivityType;
            dueDate: Date | null;
            location: string | null;
            opportunityId: string | null;
            leadId: string | null;
            subject: string;
            completedAt: Date | null;
            outcome: string | null;
            duration: number | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getActivityById(tenantId: string, activityId: string): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        client: {
            phone: string | null;
            id: string;
            email: string;
            name: string;
        } | null;
        lead: {
            phone: string | null;
            id: string;
            status: import(".prisma/client").$Enums.LeadStatus;
            firstName: string;
            lastName: string;
            email: string;
            score: number;
        } | null;
        opportunity: {
            value: import("@prisma/client/runtime/library").Decimal;
            id: string;
            title: string;
            probability: number;
            stage: import(".prisma/client").$Enums.PipelineStage;
        } | null;
    } & {
        userId: string;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        dueDate: Date | null;
        location: string | null;
        opportunityId: string | null;
        leadId: string | null;
        subject: string;
        completedAt: Date | null;
        outcome: string | null;
        duration: number | null;
    }>;
    createActivity(tenantId: string, userId: string, data: CreateActivityData): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        client: {
            id: string;
            email: string;
            name: string;
        } | null;
        lead: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
        opportunity: {
            value: import("@prisma/client/runtime/library").Decimal;
            id: string;
            title: string;
            stage: import(".prisma/client").$Enums.PipelineStage;
        } | null;
    } & {
        userId: string;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        dueDate: Date | null;
        location: string | null;
        opportunityId: string | null;
        leadId: string | null;
        subject: string;
        completedAt: Date | null;
        outcome: string | null;
        duration: number | null;
    }>;
    updateActivity(tenantId: string, activityId: string, data: UpdateActivityData): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        client: {
            id: string;
            email: string;
            name: string;
        } | null;
        lead: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
        opportunity: {
            value: import("@prisma/client/runtime/library").Decimal;
            id: string;
            title: string;
            stage: import(".prisma/client").$Enums.PipelineStage;
        } | null;
    } & {
        userId: string;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        dueDate: Date | null;
        location: string | null;
        opportunityId: string | null;
        leadId: string | null;
        subject: string;
        completedAt: Date | null;
        outcome: string | null;
        duration: number | null;
    }>;
    deleteActivity(tenantId: string, activityId: string): Promise<void>;
    completeActivity(tenantId: string, activityId: string, outcome?: string): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
    } & {
        userId: string;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        dueDate: Date | null;
        location: string | null;
        opportunityId: string | null;
        leadId: string | null;
        subject: string;
        completedAt: Date | null;
        outcome: string | null;
        duration: number | null;
    }>;
    bulkAction(tenantId: string, data: BulkActionData): Promise<{
        action: "delete" | "complete" | "assign";
        affected: any;
        activityIds: string[];
    }>;
    getActivityStats(tenantId: string): Promise<ActivityStats>;
    getActivityTimeline(tenantId: string, query: TimelineQuery): Promise<Record<string, ({
        user: {
            firstName: string;
            lastName: string;
        };
        client: {
            name: string;
        } | null;
        lead: {
            firstName: string;
            lastName: string;
        } | null;
        opportunity: {
            title: string;
        } | null;
    } & {
        userId: string;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        dueDate: Date | null;
        location: string | null;
        opportunityId: string | null;
        leadId: string | null;
        subject: string;
        completedAt: Date | null;
        outcome: string | null;
        duration: number | null;
    })[]>>;
    getUpcomingActivities(tenantId: string, userId: string, days?: number): Promise<({
        client: {
            name: string;
        } | null;
        lead: {
            firstName: string;
            lastName: string;
        } | null;
        opportunity: {
            title: string;
        } | null;
    } & {
        userId: string;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        dueDate: Date | null;
        location: string | null;
        opportunityId: string | null;
        leadId: string | null;
        subject: string;
        completedAt: Date | null;
        outcome: string | null;
        duration: number | null;
    })[]>;
    getOverdueActivities(tenantId: string, userId: string): Promise<({
        client: {
            name: string;
        } | null;
        lead: {
            firstName: string;
            lastName: string;
        } | null;
        opportunity: {
            title: string;
        } | null;
    } & {
        userId: string;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        dueDate: Date | null;
        location: string | null;
        opportunityId: string | null;
        leadId: string | null;
        subject: string;
        completedAt: Date | null;
        outcome: string | null;
        duration: number | null;
    })[]>;
    getActivitiesByEntity(tenantId: string, entityType: 'lead' | 'client' | 'opportunity', entityId: string): Promise<({
        user: {
            firstName: string;
            lastName: string;
        };
    } & {
        userId: string;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: import(".prisma/client").$Enums.ActivityType;
        dueDate: Date | null;
        location: string | null;
        opportunityId: string | null;
        leadId: string | null;
        subject: string;
        completedAt: Date | null;
        outcome: string | null;
        duration: number | null;
    })[]>;
}
export declare const activityService: ActivityService;
export {};
//# sourceMappingURL=activityService.d.ts.map