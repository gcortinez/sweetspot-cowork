import { RenewalStatus } from './contractLifecycleService';
export declare enum RenewalTrigger {
    DAYS_BEFORE_EXPIRY = "DAYS_BEFORE_EXPIRY",
    MANUAL = "MANUAL",
    AUTO_ON_EXPIRY = "AUTO_ON_EXPIRY"
}
export declare enum RenewalType {
    EXTEND_CURRENT = "EXTEND_CURRENT",
    NEW_CONTRACT = "NEW_CONTRACT",
    RENEGOTIATE = "RENEGOTIATE"
}
export declare enum NotificationType {
    EMAIL = "EMAIL",
    SMS = "SMS",
    IN_APP = "IN_APP",
    WEBHOOK = "WEBHOOK"
}
interface RenewalRule {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    isActive: boolean;
    contractTypes: string[];
    trigger: RenewalTrigger;
    triggerDays?: number;
    renewalType: RenewalType;
    autoApprove: boolean;
    renewalPeriod: number;
    priceAdjustment?: {
        type: 'PERCENTAGE' | 'FIXED_AMOUNT';
        value: number;
    };
    notificationSettings: {
        enabled: boolean;
        types: NotificationType[];
        recipients: string[];
        template?: string;
    };
    conditions?: {
        minContractValue?: number;
        maxContractValue?: number;
        clientTypes?: string[];
        excludeClientIds?: string[];
    };
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
interface CreateRenewalRuleData {
    name: string;
    description?: string;
    contractTypes: string[];
    trigger: RenewalTrigger;
    triggerDays?: number;
    renewalType: RenewalType;
    autoApprove: boolean;
    renewalPeriod: number;
    priceAdjustment?: {
        type: 'PERCENTAGE' | 'FIXED_AMOUNT';
        value: number;
    };
    notificationSettings: {
        enabled: boolean;
        types: NotificationType[];
        recipients: string[];
        template?: string;
    };
    conditions?: {
        minContractValue?: number;
        maxContractValue?: number;
        clientTypes?: string[];
        excludeClientIds?: string[];
    };
    metadata?: Record<string, any>;
}
interface RenewalProposal {
    id: string;
    contractId: string;
    ruleId?: string;
    tenantId: string;
    currentContractEndDate: Date;
    proposedStartDate: Date;
    proposedEndDate: Date;
    renewalPeriod: number;
    currentValue?: number;
    proposedValue?: number;
    priceAdjustment?: {
        type: 'PERCENTAGE' | 'FIXED_AMOUNT';
        value: number;
        reason: string;
    };
    status: RenewalStatus;
    renewalType: RenewalType;
    terms?: string[];
    notes?: string;
    approvedBy?: string;
    approvedAt?: Date;
    declinedBy?: string;
    declinedAt?: Date;
    declineReason?: string;
    processedAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
interface ProcessRenewalData {
    action: 'APPROVE' | 'DECLINE';
    notes?: string;
    declineReason?: string;
    modifyTerms?: boolean;
    newValue?: number;
    newEndDate?: Date;
}
interface RenewalQuery {
    page: number;
    limit: number;
    status?: RenewalStatus;
    contractId?: string;
    ruleId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface RenewalStats {
    totalProposals: number;
    pendingApproval: number;
    autoApproved: number;
    declined: number;
    processed: number;
    successRate: number;
    byStatus: Array<{
        status: RenewalStatus;
        count: number;
        percentage: number;
    }>;
    byRenewalType: Array<{
        type: RenewalType;
        count: number;
        successRate: number;
    }>;
    upcomingRenewals: Array<{
        contractId: string;
        contractTitle: string;
        clientName: string;
        expiryDate: Date;
        daysUntilExpiry: number;
        hasActiveRule: boolean;
    }>;
    recentActivity: Array<{
        id: string;
        contractId: string;
        action: string;
        performedBy: string;
        performedAt: Date;
    }>;
}
declare class ContractRenewalService {
    createRenewalRule(tenantId: string, createdBy: string, data: CreateRenewalRuleData): Promise<RenewalRule>;
    getRenewalRules(tenantId: string): Promise<RenewalRule[]>;
    updateRenewalRule(tenantId: string, ruleId: string, updates: Partial<CreateRenewalRuleData>): Promise<RenewalRule>;
    deleteRenewalRule(tenantId: string, ruleId: string): Promise<{
        success: boolean;
    }>;
    createRenewalProposal(tenantId: string, contractId: string, createdBy: string, ruleId?: string): Promise<RenewalProposal>;
    getRenewalProposals(tenantId: string, query: RenewalQuery): Promise<{
        proposals: RenewalProposal[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    processRenewalProposal(tenantId: string, proposalId: string, processedBy: string, data: ProcessRenewalData): Promise<RenewalProposal>;
    checkAndCreateRenewals(tenantId: string): Promise<{
        created: number;
        processed: number;
        notifications: number;
    }>;
    getRenewalStats(tenantId: string): Promise<RenewalStats>;
    private findApplicableRule;
    private isContractEligibleForRule;
    private executeRenewal;
    private sendRenewalNotifications;
    private generateId;
}
export declare const contractRenewalService: ContractRenewalService;
export {};
//# sourceMappingURL=contractRenewalService.d.ts.map