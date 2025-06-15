export declare enum ContractStatus {
    DRAFT = "DRAFT",
    PENDING_SIGNATURE = "PENDING_SIGNATURE",
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    EXPIRED = "EXPIRED",
    TERMINATED = "TERMINATED",
    CANCELLED = "CANCELLED"
}
export declare enum ContractType {
    MEMBERSHIP = "MEMBERSHIP",
    SERVICE = "SERVICE",
    EVENT_SPACE = "EVENT_SPACE",
    MEETING_ROOM = "MEETING_ROOM",
    CUSTOM = "CUSTOM"
}
export declare enum RenewalStatus {
    NONE = "NONE",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    DECLINED = "DECLINED",
    AUTO_RENEWED = "AUTO_RENEWED"
}
interface ContractParty {
    id: string;
    name: string;
    email: string;
    role: 'CLIENT' | 'COMPANY';
    signedAt?: Date;
    userId?: string;
    clientId?: string;
}
interface ContractTerm {
    id: string;
    title: string;
    content: string;
    order: number;
    isRequired: boolean;
}
interface CreateContractData {
    templateId?: string;
    quotationId?: string;
    opportunityId?: string;
    type: ContractType;
    title: string;
    content: string;
    parties: ContractParty[];
    terms: ContractTerm[];
    startDate: Date;
    endDate?: Date;
    autoRenewal: boolean;
    renewalPeriod?: number;
    value?: number;
    currency?: string;
    metadata?: Record<string, any>;
}
interface UpdateContractData {
    title?: string;
    content?: string;
    parties?: ContractParty[];
    terms?: ContractTerm[];
    startDate?: Date;
    endDate?: Date;
    autoRenewal?: boolean;
    renewalPeriod?: number;
    value?: number;
    currency?: string;
    metadata?: Record<string, any>;
}
interface ContractQuery {
    page: number;
    limit: number;
    status?: ContractStatus;
    type?: ContractType;
    clientId?: string;
    templateId?: string;
    dateFrom?: string;
    dateTo?: string;
    expiringDays?: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
interface Contract {
    id: string;
    tenantId: string;
    templateId?: string;
    quotationId?: string;
    opportunityId?: string;
    type: ContractType;
    title: string;
    content: string;
    status: ContractStatus;
    parties: ContractParty[];
    terms: ContractTerm[];
    startDate: Date;
    endDate?: Date;
    autoRenewal: boolean;
    renewalPeriod?: number;
    renewalStatus: RenewalStatus;
    value?: number;
    currency?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    activatedAt?: Date;
    terminatedAt?: Date;
    createdBy: string;
    signatureWorkflowId?: string;
}
interface ContractActivity {
    id: string;
    contractId: string;
    type: string;
    description: string;
    performedBy: string;
    performedAt: Date;
    metadata: Record<string, any>;
}
interface ContractStats {
    totalContracts: number;
    activeContracts: number;
    pendingSignature: number;
    expiringThisMonth: number;
    byStatus: Array<{
        status: ContractStatus;
        count: number;
        percentage: number;
    }>;
    byType: Array<{
        type: ContractType;
        count: number;
        value: number;
    }>;
    recentActivity: ContractActivity[];
    totalValue: number;
    monthlyValue: number;
}
declare class ContractLifecycleService {
    createContract(tenantId: string, createdBy: string, data: CreateContractData): Promise<Contract>;
    getContracts(tenantId: string, query: ContractQuery): Promise<{
        contracts: Contract[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getContractById(tenantId: string, contractId: string): Promise<Contract>;
    updateContract(tenantId: string, contractId: string, data: UpdateContractData): Promise<Contract>;
    activateContract(tenantId: string, contractId: string, activatedBy: string): Promise<Contract>;
    suspendContract(tenantId: string, contractId: string, suspendedBy: string, reason?: string): Promise<Contract>;
    reactivateContract(tenantId: string, contractId: string, reactivatedBy: string): Promise<Contract>;
    terminateContract(tenantId: string, contractId: string, terminatedBy: string, reason?: string, terminationDate?: Date): Promise<Contract>;
    cancelContract(tenantId: string, contractId: string, cancelledBy: string, reason?: string): Promise<Contract>;
    getContractActivity(tenantId: string, contractId: string): Promise<ContractActivity[]>;
    getContractStats(tenantId: string): Promise<ContractStats>;
    getExpiringContracts(tenantId: string, days?: number): Promise<Contract[]>;
    sendContractForSignature(tenantId: string, contractId: string, sentBy: string): Promise<{
        success: boolean;
        workflowId: string;
    }>;
    private validateContractParties;
    private createActivity;
    private generateId;
}
export declare const contractLifecycleService: ContractLifecycleService;
export {};
//# sourceMappingURL=contractLifecycleService.d.ts.map