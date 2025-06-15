import { LeadSource, LeadStatus } from '@prisma/client';
interface CreateLeadData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    source: LeadSource;
    channel?: string;
    budget?: number;
    interests?: string[];
    score?: number;
    qualificationNotes?: string;
    assignedToId?: string;
}
interface UpdateLeadData extends Partial<CreateLeadData> {
    status?: LeadStatus;
}
interface LeadQuery {
    page: number;
    limit: number;
    search?: string;
    status?: LeadStatus;
    source?: LeadSource;
    assignedToId?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface LeadStats {
    total: number;
    byStatus: Record<LeadStatus, number>;
    bySource: Record<LeadSource, number>;
    averageScore: number;
    conversionRate: number;
    recentLeads: number;
}
declare class LeadService {
    getLeads(tenantId: string, query: LeadQuery): Promise<{
        leads: ({
            client: {
                id: string;
                email: string;
                name: string;
            } | null;
            assignedTo: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            } | null;
            _count: {
                activities: number;
                opportunities: number;
                tasks: number;
            };
        } & {
            tenantId: string;
            phone: string | null;
            id: string;
            clientId: string | null;
            status: import(".prisma/client").$Enums.LeadStatus;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            email: string;
            company: string | null;
            position: string | null;
            source: import(".prisma/client").$Enums.LeadSource;
            channel: string | null;
            budget: import("@prisma/client/runtime/library").Decimal | null;
            interests: import("@prisma/client/runtime/library").JsonValue | null;
            score: number;
            qualificationNotes: string | null;
            assignedToId: string | null;
            lastContactAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getLeadById(tenantId: string, leadId: string): Promise<{
        client: {
            id: string;
            email: string;
            name: string;
        } | null;
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
        activities: {
            id: string;
            type: import(".prisma/client").$Enums.ActivityType;
            dueDate: Date | null;
            subject: string;
            completedAt: Date | null;
        }[];
        communications: {
            id: string;
            status: import(".prisma/client").$Enums.CommStatus;
            createdAt: Date;
            type: import(".prisma/client").$Enums.CommunicationType;
            subject: string;
            direction: import(".prisma/client").$Enums.CommDirection;
        }[];
        opportunities: {
            value: import("@prisma/client/runtime/library").Decimal;
            id: string;
            title: string;
            stage: import(".prisma/client").$Enums.PipelineStage;
            expectedCloseDate: Date | null;
        }[];
        tasks: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            dueDate: Date;
            priority: import(".prisma/client").$Enums.TaskPriority;
        }[];
    } & {
        tenantId: string;
        phone: string | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        email: string;
        company: string | null;
        position: string | null;
        source: import(".prisma/client").$Enums.LeadSource;
        channel: string | null;
        budget: import("@prisma/client/runtime/library").Decimal | null;
        interests: import("@prisma/client/runtime/library").JsonValue | null;
        score: number;
        qualificationNotes: string | null;
        assignedToId: string | null;
        lastContactAt: Date | null;
    }>;
    createLead(tenantId: string, data: CreateLeadData): Promise<{
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        tenantId: string;
        phone: string | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        email: string;
        company: string | null;
        position: string | null;
        source: import(".prisma/client").$Enums.LeadSource;
        channel: string | null;
        budget: import("@prisma/client/runtime/library").Decimal | null;
        interests: import("@prisma/client/runtime/library").JsonValue | null;
        score: number;
        qualificationNotes: string | null;
        assignedToId: string | null;
        lastContactAt: Date | null;
    }>;
    updateLead(tenantId: string, leadId: string, data: UpdateLeadData): Promise<{
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        tenantId: string;
        phone: string | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        email: string;
        company: string | null;
        position: string | null;
        source: import(".prisma/client").$Enums.LeadSource;
        channel: string | null;
        budget: import("@prisma/client/runtime/library").Decimal | null;
        interests: import("@prisma/client/runtime/library").JsonValue | null;
        score: number;
        qualificationNotes: string | null;
        assignedToId: string | null;
        lastContactAt: Date | null;
    }>;
    deleteLead(tenantId: string, leadId: string): Promise<void>;
    assignLead(tenantId: string, leadId: string, assignedToId: string): Promise<{
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        tenantId: string;
        phone: string | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        email: string;
        company: string | null;
        position: string | null;
        source: import(".prisma/client").$Enums.LeadSource;
        channel: string | null;
        budget: import("@prisma/client/runtime/library").Decimal | null;
        interests: import("@prisma/client/runtime/library").JsonValue | null;
        score: number;
        qualificationNotes: string | null;
        assignedToId: string | null;
        lastContactAt: Date | null;
    }>;
    updateLeadScore(tenantId: string, leadId: string, score: number): Promise<{
        tenantId: string;
        phone: string | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        email: string;
        company: string | null;
        position: string | null;
        source: import(".prisma/client").$Enums.LeadSource;
        channel: string | null;
        budget: import("@prisma/client/runtime/library").Decimal | null;
        interests: import("@prisma/client/runtime/library").JsonValue | null;
        score: number;
        qualificationNotes: string | null;
        assignedToId: string | null;
        lastContactAt: Date | null;
    }>;
    addLeadNote(tenantId: string, leadId: string, note: string): Promise<{
        tenantId: string;
        phone: string | null;
        id: string;
        clientId: string | null;
        status: import(".prisma/client").$Enums.LeadStatus;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        email: string;
        company: string | null;
        position: string | null;
        source: import(".prisma/client").$Enums.LeadSource;
        channel: string | null;
        budget: import("@prisma/client/runtime/library").Decimal | null;
        interests: import("@prisma/client/runtime/library").JsonValue | null;
        score: number;
        qualificationNotes: string | null;
        assignedToId: string | null;
        lastContactAt: Date | null;
    }>;
    getLeadStats(tenantId: string): Promise<LeadStats>;
}
export declare const leadService: LeadService;
export {};
//# sourceMappingURL=leadService.d.ts.map