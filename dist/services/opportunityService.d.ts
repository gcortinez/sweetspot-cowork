import { PipelineStage } from '@prisma/client';
interface CreateOpportunityData {
    title: string;
    description?: string;
    value: number;
    probability: number;
    expectedRevenue: number;
    stage: PipelineStage;
    expectedCloseDate?: string;
    leadId?: string;
    clientId?: string;
    assignedToId?: string;
    competitorInfo?: string;
}
interface UpdateOpportunityData extends Partial<CreateOpportunityData> {
    lostReason?: string;
    actualCloseDate?: string;
}
interface OpportunityQuery {
    page: number;
    limit: number;
    search?: string;
    stage?: PipelineStage;
    assignedToId?: string;
    leadId?: string;
    clientId?: string;
    minValue?: number;
    maxValue?: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface PipelineStats {
    totalOpportunities: number;
    totalValue: number;
    averageValue: number;
    averageProbability: number;
    expectedRevenue: number;
    byStage: Record<PipelineStage, {
        count: number;
        value: number;
        probability: number;
    }>;
    conversionRates: Record<string, number>;
    averageSalescycle: number;
}
interface PipelineFunnel {
    stages: Array<{
        stage: PipelineStage;
        name: string;
        count: number;
        value: number;
        conversionRate: number;
        opportunities: Array<{
            id: string;
            title: string;
            value: number;
            probability: number;
            assignedTo?: {
                firstName: string;
                lastName: string;
            };
            lead?: {
                firstName: string;
                lastName: string;
            };
            client?: {
                name: string;
            };
        }>;
    }>;
}
declare class OpportunityService {
    getOpportunities(tenantId: string, query: OpportunityQuery): Promise<{
        opportunities: ({
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
            assignedTo: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            } | null;
            _count: {
                activities: number;
                tasks: number;
                quotations: number;
            };
            quotations: {
                total: import("@prisma/client/runtime/library").Decimal;
                id: string;
                status: import(".prisma/client").$Enums.QuotationStatus;
                createdAt: Date;
            }[];
        } & {
            tenantId: string;
            value: import("@prisma/client/runtime/library").Decimal;
            id: string;
            clientId: string | null;
            title: string;
            createdAt: Date;
            updatedAt: Date;
            assignedToId: string | null;
            description: string | null;
            leadId: string | null;
            probability: number;
            expectedRevenue: import("@prisma/client/runtime/library").Decimal;
            stage: import(".prisma/client").$Enums.PipelineStage;
            expectedCloseDate: Date | null;
            actualCloseDate: Date | null;
            lostReason: string | null;
            competitorInfo: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getOpportunityById(tenantId: string, opportunityId: string): Promise<{
        client: {
            phone: string | null;
            id: string;
            email: string;
            name: string;
        } | null;
        lead: {
            phone: string | null;
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            score: number;
        } | null;
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
        activities: {
            user: {
                firstName: string;
                lastName: string;
            };
            id: string;
            type: import(".prisma/client").$Enums.ActivityType;
            dueDate: Date | null;
            subject: string;
            completedAt: Date | null;
            outcome: string | null;
        }[];
        tasks: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            dueDate: Date;
            priority: import(".prisma/client").$Enums.TaskPriority;
            assignedTo: {
                firstName: string;
                lastName: string;
            } | null;
        }[];
        quotations: {
            number: string;
            total: import("@prisma/client/runtime/library").Decimal;
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.QuotationStatus;
            createdAt: Date;
            validUntil: Date;
        }[];
    } & {
        tenantId: string;
        value: import("@prisma/client/runtime/library").Decimal;
        id: string;
        clientId: string | null;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        leadId: string | null;
        probability: number;
        expectedRevenue: import("@prisma/client/runtime/library").Decimal;
        stage: import(".prisma/client").$Enums.PipelineStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
        lostReason: string | null;
        competitorInfo: string | null;
    }>;
    createOpportunity(tenantId: string, data: CreateOpportunityData): Promise<{
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
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        tenantId: string;
        value: import("@prisma/client/runtime/library").Decimal;
        id: string;
        clientId: string | null;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        leadId: string | null;
        probability: number;
        expectedRevenue: import("@prisma/client/runtime/library").Decimal;
        stage: import(".prisma/client").$Enums.PipelineStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
        lostReason: string | null;
        competitorInfo: string | null;
    }>;
    updateOpportunity(tenantId: string, opportunityId: string, data: UpdateOpportunityData): Promise<{
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
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        tenantId: string;
        value: import("@prisma/client/runtime/library").Decimal;
        id: string;
        clientId: string | null;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        leadId: string | null;
        probability: number;
        expectedRevenue: import("@prisma/client/runtime/library").Decimal;
        stage: import(".prisma/client").$Enums.PipelineStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
        lostReason: string | null;
        competitorInfo: string | null;
    }>;
    deleteOpportunity(tenantId: string, opportunityId: string): Promise<void>;
    updateStage(tenantId: string, opportunityId: string, stage: PipelineStage, userId: string, reason?: string, notes?: string): Promise<{
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        tenantId: string;
        value: import("@prisma/client/runtime/library").Decimal;
        id: string;
        clientId: string | null;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        leadId: string | null;
        probability: number;
        expectedRevenue: import("@prisma/client/runtime/library").Decimal;
        stage: import(".prisma/client").$Enums.PipelineStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
        lostReason: string | null;
        competitorInfo: string | null;
    }>;
    assignOpportunity(tenantId: string, opportunityId: string, assignedToId: string): Promise<{
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        tenantId: string;
        value: import("@prisma/client/runtime/library").Decimal;
        id: string;
        clientId: string | null;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        leadId: string | null;
        probability: number;
        expectedRevenue: import("@prisma/client/runtime/library").Decimal;
        stage: import(".prisma/client").$Enums.PipelineStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
        lostReason: string | null;
        competitorInfo: string | null;
    }>;
    getPipelineStats(tenantId: string): Promise<PipelineStats>;
    getPipelineFunnel(tenantId: string): Promise<PipelineFunnel>;
    createOpportunityFromLead(tenantId: string, leadId: string, data: Omit<CreateOpportunityData, 'leadId'>): Promise<{
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
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        } | null;
    } & {
        tenantId: string;
        value: import("@prisma/client/runtime/library").Decimal;
        id: string;
        clientId: string | null;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        assignedToId: string | null;
        description: string | null;
        leadId: string | null;
        probability: number;
        expectedRevenue: import("@prisma/client/runtime/library").Decimal;
        stage: import(".prisma/client").$Enums.PipelineStage;
        expectedCloseDate: Date | null;
        actualCloseDate: Date | null;
        lostReason: string | null;
        competitorInfo: string | null;
    }>;
}
export declare const opportunityService: OpportunityService;
export {};
//# sourceMappingURL=opportunityService.d.ts.map