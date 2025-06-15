interface ConvertLeadData {
    leadId: string;
    clientData: {
        name: string;
        email: string;
        phone?: string;
        address?: string;
        taxId?: string;
        contactPerson?: string;
        notes?: string;
    };
    createOpportunity: boolean;
    opportunityData?: {
        title: string;
        description?: string;
        value: number;
        probability: number;
        stage: 'INITIAL_CONTACT' | 'NEEDS_ANALYSIS' | 'PROPOSAL_SENT' | 'NEGOTIATION';
        expectedCloseDate?: string;
    };
    conversionNotes?: string;
}
interface BatchConvertData {
    leadIds: string[];
    defaultClientData?: {
        contactPerson?: string;
        notes?: string;
    };
    createOpportunities: boolean;
    conversionNotes?: string;
}
interface ConversionsQuery {
    page: number;
    limit: number;
    dateFrom?: string;
    dateTo?: string;
    convertedById?: string;
    hasOpportunity?: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface QualifiedLeadsQuery {
    page: number;
    limit: number;
    minScore: number;
    assignedToId?: string;
}
interface ConversionStats {
    totalConversions: number;
    thisMonth: number;
    thisWeek: number;
    conversionRate: number;
    averageLeadScore: number;
    averageTimeToConversion: number;
    byUser: Array<{
        userId: string;
        userName: string;
        conversions: number;
        conversionRate: number;
    }>;
    bySource: Array<{
        source: string;
        conversions: number;
        conversionRate: number;
    }>;
    recentConversions: Array<{
        id: string;
        leadName: string;
        clientName: string;
        convertedBy: string;
        createdAt: Date;
    }>;
}
interface ConversionFunnel {
    period: string;
    stages: Array<{
        stage: string;
        count: number;
        conversionRate: number;
        dropOffRate: number;
    }>;
    totalLeads: number;
    totalConversions: number;
    overallConversionRate: number;
}
declare class ConversionService {
    convertLeadToClient(tenantId: string, convertedById: string, data: ConvertLeadData): Promise<{
        conversion: {
            tenantId: string;
            id: string;
            clientId: string;
            createdAt: Date;
            opportunityId: string | null;
            leadId: string;
            convertedById: string;
            conversionNotes: string | null;
        };
        client: {
            tenantId: string;
            phone: string | null;
            taxId: string | null;
            id: string;
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            name: string;
            address: string | null;
            contactPerson: string | null;
            notes: string | null;
        };
        opportunity: {
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
        } | null;
        lead: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
    }>;
    batchConvertLeads(tenantId: string, convertedById: string, data: BatchConvertData): Promise<{
        successful: number;
        failed: number;
        results: {
            conversion: {
                tenantId: string;
                id: string;
                clientId: string;
                createdAt: Date;
                opportunityId: string | null;
                leadId: string;
                convertedById: string;
                conversionNotes: string | null;
            };
            client: {
                tenantId: string;
                phone: string | null;
                taxId: string | null;
                id: string;
                status: import(".prisma/client").$Enums.ClientStatus;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                name: string;
                address: string | null;
                contactPerson: string | null;
                notes: string | null;
            };
            opportunity: {
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
            } | null;
            lead: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            };
        }[];
        errors: {
            leadId: string;
            error: string;
        }[];
    }>;
    getConversions(tenantId: string, query: ConversionsQuery): Promise<{
        conversions: ({
            client: {
                id: string;
                status: import(".prisma/client").$Enums.ClientStatus;
                email: string;
                name: string;
            };
            lead: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
                source: import(".prisma/client").$Enums.LeadSource;
                score: number;
            };
            opportunity: {
                value: import("@prisma/client/runtime/library").Decimal;
                id: string;
                title: string;
                probability: number;
                stage: import(".prisma/client").$Enums.PipelineStage;
            } | null;
            convertedBy: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            };
        } & {
            tenantId: string;
            id: string;
            clientId: string;
            createdAt: Date;
            opportunityId: string | null;
            leadId: string;
            convertedById: string;
            conversionNotes: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getConversionById(tenantId: string, conversionId: string): Promise<{
        client: {
            users: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            }[];
        } & {
            tenantId: string;
            phone: string | null;
            taxId: string | null;
            id: string;
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            name: string;
            address: string | null;
            contactPerson: string | null;
            notes: string | null;
        };
        lead: {
            activities: {
                user: {
                    firstName: string;
                    lastName: string;
                };
                id: string;
                createdAt: Date;
                type: import(".prisma/client").$Enums.ActivityType;
                subject: string;
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
        };
        opportunity: ({
            activities: {
                id: string;
                createdAt: Date;
                type: import(".prisma/client").$Enums.ActivityType;
                subject: string;
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
        }) | null;
        convertedBy: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
    } & {
        tenantId: string;
        id: string;
        clientId: string;
        createdAt: Date;
        opportunityId: string | null;
        leadId: string;
        convertedById: string;
        conversionNotes: string | null;
    }>;
    getConversionStats(tenantId: string): Promise<ConversionStats>;
    getConversionFunnel(tenantId: string, period: string): Promise<ConversionFunnel>;
    getQualifiedLeads(tenantId: string, query: QualifiedLeadsQuery): Promise<{
        leads: ({
            assignedTo: {
                firstName: string;
                lastName: string;
            } | null;
            opportunities: {
                id: string;
                title: string;
                stage: import(".prisma/client").$Enums.PipelineStage;
            }[];
            conversions: {
                tenantId: string;
                id: string;
                clientId: string;
                createdAt: Date;
                opportunityId: string | null;
                leadId: string;
                convertedById: string;
                conversionNotes: string | null;
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
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    previewConversion(tenantId: string, leadId: string): Promise<{
        lead: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            score: number;
            status: import(".prisma/client").$Enums.LeadStatus;
            source: import(".prisma/client").$Enums.LeadSource;
        };
        suggestedClientData: {
            name: string;
            email: string;
            phone: string | null;
            contactPerson: string | undefined;
        };
        existingOpportunities: {
            value: import("@prisma/client/runtime/library").Decimal;
            id: string;
            title: string;
            stage: import(".prisma/client").$Enums.PipelineStage;
        }[];
        recentActivities: {
            type: import(".prisma/client").$Enums.ActivityType;
            subject: string;
            completedAt: Date | null;
        }[];
        conflicts: {
            emailExists: boolean;
            existingClientId: string | undefined;
        };
        readyForConversion: boolean;
    }>;
    getUserConversionPerformance(tenantId: string, userId: string, period: string): Promise<{
        period: string;
        conversions: number;
        assignedLeads: number;
        conversionRate: number;
        marketShare: number;
        performance: string;
    }>;
}
export declare const conversionService: ConversionService;
export {};
//# sourceMappingURL=conversionService.d.ts.map