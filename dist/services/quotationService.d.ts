import { Quotation, QuotationStatus, Contract } from '@prisma/client';
interface QuotationItem {
    id?: string;
    description: string;
    planType?: string;
    spaceType?: string;
    quantity: number;
    unitPrice: number;
    duration: number;
    billingCycle?: string;
    total: number;
    metadata?: Record<string, any>;
}
interface CreateQuotationData {
    clientId?: string;
    opportunityId?: string;
    leadId?: string;
    title: string;
    description?: string;
    items: QuotationItem[];
    discounts?: number;
    taxes?: number;
    currency?: string;
    validUntil: string;
    terms?: string;
    notes?: string;
}
interface UpdateQuotationData {
    title?: string;
    description?: string;
    items?: QuotationItem[];
    discounts?: number;
    taxes?: number;
    validUntil?: string;
    terms?: string;
    notes?: string;
    status?: QuotationStatus;
}
interface QuotationsQuery {
    page: number;
    limit: number;
    status?: QuotationStatus;
    clientId?: string;
    opportunityId?: string;
    leadId?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface QuotationWithRelations extends Quotation {
    client?: {
        id: string;
        name: string;
        email: string;
    };
    opportunity?: {
        id: string;
        title: string;
        stage: string;
    };
    lead?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    contracts: Contract[];
}
interface ConvertToContractData {
    title: string;
    description?: string;
    terms?: string;
    startDate: string;
    endDate?: string;
    autoRenew?: boolean;
    renewalPeriod?: string;
}
declare class QuotationService {
    createQuotation(tenantId: string, createdBy: string, data: CreateQuotationData): Promise<Quotation>;
    getQuotations(tenantId: string, query: QuotationsQuery): Promise<{
        quotations: QuotationWithRelations[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getQuotationById(tenantId: string, quotationId: string): Promise<QuotationWithRelations>;
    updateQuotation(tenantId: string, quotationId: string, data: UpdateQuotationData): Promise<Quotation>;
    deleteQuotation(tenantId: string, quotationId: string): Promise<{
        success: boolean;
    }>;
    sendQuotation(tenantId: string, quotationId: string): Promise<Quotation>;
    markQuotationAsViewed(tenantId: string, quotationId: string): Promise<Quotation>;
    acceptQuotation(tenantId: string, quotationId: string, approvedBy: string): Promise<Quotation>;
    rejectQuotation(tenantId: string, quotationId: string, reason?: string): Promise<Quotation>;
    convertToContract(tenantId: string, quotationId: string, createdBy: string, contractData: ConvertToContractData): Promise<Contract>;
    getQuotationStats(tenantId: string): Promise<{
        total: number;
        byStatus: Array<{
            status: QuotationStatus;
            count: number;
            percentage: number;
        }>;
        totalValue: number;
        acceptanceRate: number;
        averageValue: number;
        expiringThisWeek: number;
        recentQuotations: Array<{
            id: string;
            number: string;
            title: string;
            status: QuotationStatus;
            total: number;
            clientName?: string;
            createdAt: Date;
        }>;
    }>;
    duplicateQuotation(tenantId: string, quotationId: string, createdBy: string): Promise<Quotation>;
    private generateQuotationNumber;
    private generateContractNumber;
}
export declare const quotationService: QuotationService;
export {};
//# sourceMappingURL=quotationService.d.ts.map