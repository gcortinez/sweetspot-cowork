import { CommunicationType, CommunicationDirection } from '@prisma/client';
interface CreateCommunicationData {
    type: CommunicationType;
    direction: CommunicationDirection;
    subject: string;
    content?: string;
    fromEmail?: string;
    toEmail?: string;
    fromPhone?: string;
    toPhone?: string;
    leadId?: string;
    clientId?: string;
    opportunityId?: string;
    activityId?: string;
    attachments?: string[];
    metadata?: Record<string, any>;
}
interface UpdateCommunicationData {
    subject?: string;
    content?: string;
    attachments?: string[];
    metadata?: Record<string, any>;
}
interface CommunicationsQuery {
    page: number;
    limit: number;
    type?: CommunicationType;
    direction?: CommunicationDirection;
    entityType?: 'LEAD' | 'CLIENT' | 'OPPORTUNITY';
    entityId?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface CommunicationStats {
    total: number;
    byType: Array<{
        type: CommunicationType;
        count: number;
        percentage: number;
    }>;
    byDirection: Array<{
        direction: CommunicationDirection;
        count: number;
        percentage: number;
    }>;
    thisWeek: number;
    thisMonth: number;
    averageResponseTime: number;
    mostActiveUsers: Array<{
        userId: string;
        userName: string;
        communicationCount: number;
    }>;
    recentCommunications: Array<{
        id: string;
        type: CommunicationType;
        direction: CommunicationDirection;
        subject: string;
        entityName: string;
        userName: string;
        createdAt: Date;
    }>;
}
declare class CommunicationService {
    createCommunication(tenantId: string, userId: string, data: CreateCommunicationData): Promise<{
        userId: string;
        tenantId: string;
        content: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.CommStatus;
        createdAt: Date;
        type: import(".prisma/client").$Enums.CommunicationType;
        leadId: string | null;
        subject: string;
        direction: import(".prisma/client").$Enums.CommDirection;
        fromEmail: string | null;
        toEmail: string | null;
        sentAt: Date | null;
        readAt: Date | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getCommunications(tenantId: string, query: CommunicationsQuery): Promise<{
        communications: {
            userId: string;
            tenantId: string;
            content: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            clientId: string | null;
            status: import(".prisma/client").$Enums.CommStatus;
            createdAt: Date;
            type: import(".prisma/client").$Enums.CommunicationType;
            leadId: string | null;
            subject: string;
            direction: import(".prisma/client").$Enums.CommDirection;
            fromEmail: string | null;
            toEmail: string | null;
            sentAt: Date | null;
            readAt: Date | null;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getCommunicationById(tenantId: string, communicationId: string): Promise<{
        userId: string;
        tenantId: string;
        content: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.CommStatus;
        createdAt: Date;
        type: import(".prisma/client").$Enums.CommunicationType;
        leadId: string | null;
        subject: string;
        direction: import(".prisma/client").$Enums.CommDirection;
        fromEmail: string | null;
        toEmail: string | null;
        sentAt: Date | null;
        readAt: Date | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateCommunication(tenantId: string, communicationId: string, data: UpdateCommunicationData): Promise<{
        userId: string;
        tenantId: string;
        content: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.CommStatus;
        createdAt: Date;
        type: import(".prisma/client").$Enums.CommunicationType;
        leadId: string | null;
        subject: string;
        direction: import(".prisma/client").$Enums.CommDirection;
        fromEmail: string | null;
        toEmail: string | null;
        sentAt: Date | null;
        readAt: Date | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    deleteCommunication(tenantId: string, communicationId: string): Promise<{
        success: boolean;
    }>;
    getCommunicationThread(tenantId: string, entityType: 'LEAD' | 'CLIENT' | 'OPPORTUNITY', entityId: string): Promise<{
        entityType: "LEAD" | "CLIENT" | "OPPORTUNITY";
        entityId: string;
        entityName: string;
        communications: ({
            user: {
                firstName: string;
                lastName: string;
            };
        } & {
            userId: string;
            tenantId: string;
            content: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            clientId: string | null;
            status: import(".prisma/client").$Enums.CommStatus;
            createdAt: Date;
            type: import(".prisma/client").$Enums.CommunicationType;
            leadId: string | null;
            subject: string;
            direction: import(".prisma/client").$Enums.CommDirection;
            fromEmail: string | null;
            toEmail: string | null;
            sentAt: Date | null;
            readAt: Date | null;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        totalCount: number;
    }>;
    getCommunicationStats(tenantId: string): Promise<CommunicationStats>;
    markAsRead(tenantId: string, communicationId: string, userId: string): Promise<{
        userId: string;
        tenantId: string;
        content: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.CommStatus;
        createdAt: Date;
        type: import(".prisma/client").$Enums.CommunicationType;
        leadId: string | null;
        subject: string;
        direction: import(".prisma/client").$Enums.CommDirection;
        fromEmail: string | null;
        toEmail: string | null;
        sentAt: Date | null;
        readAt: Date | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    bulkDelete(tenantId: string, communicationIds: string[]): Promise<{
        deletedCount: number;
        success: boolean;
    }>;
}
export declare const communicationService: CommunicationService;
export {};
//# sourceMappingURL=communicationService.d.ts.map