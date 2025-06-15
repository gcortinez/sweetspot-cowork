import { ReconciliationType, ReconciliationStatus, MatchStatus, DiscrepancyType, ReportPeriod } from '@prisma/client';
export interface PaymentReconciliationData {
    id: string;
    reconciliationType: ReconciliationType;
    period: ReportPeriod;
    startDate: Date;
    endDate: Date;
    bankStatementTotal: number;
    recordedPaymentsTotal: number;
    variance: number;
    status: ReconciliationStatus;
    matchedTransactions: number;
    unmatchedTransactions: number;
    duplicateTransactions: number;
    missingTransactions: number;
    discrepancies: any[];
    adjustments: any[];
    notes?: string;
    reconciliationRules: any;
    autoMatchPercentage: number;
    manualReview: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    reconciledBy: string;
    reconciledAt: Date;
    createdAt: Date;
    updatedAt: Date;
    transactions: PaymentReconciliationItemData[];
}
export interface PaymentReconciliationItemData {
    id: string;
    reconciliationId: string;
    paymentId?: string;
    transactionReference: string;
    bankReference?: string;
    amount: number;
    currency: string;
    transactionDate: Date;
    description?: string;
    matchStatus: MatchStatus;
    matchConfidence: number;
    matchedBy?: string;
    matchedAt?: Date;
    discrepancyType?: DiscrepancyType;
    discrepancyAmount?: number;
    notes?: string;
    requiresAction: boolean;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateReconciliationRequest {
    reconciliationType: ReconciliationType;
    period: ReportPeriod;
    startDate: Date;
    endDate: Date;
    bankStatementFile?: string;
    reconciliationRules?: ReconciliationRules;
    autoMatch?: boolean;
}
export interface ReconciliationRules {
    amountTolerance: number;
    amountTolerancePercent: number;
    dateTolerance: number;
    descriptionMatching: {
        enabled: boolean;
        minimumSimilarity: number;
        keywordMatching: boolean;
    };
    referenceMatching: {
        enabled: boolean;
        strictMatching: boolean;
    };
    duplicateDetection: {
        enabled: boolean;
        timeWindow: number;
    };
    autoApproval: {
        enabled: boolean;
        confidenceThreshold: number;
        amountLimit: number;
    };
}
export interface BankTransaction {
    reference: string;
    bankReference?: string;
    amount: number;
    currency: string;
    date: Date;
    description: string;
    accountNumber?: string;
    routing?: string;
    metadata?: any;
}
export interface MatchingResult {
    paymentId: string;
    confidence: number;
    matchReasons: string[];
    discrepancies: Array<{
        type: DiscrepancyType;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        description: string;
        amount?: number;
    }>;
}
export interface ReconciliationSummary {
    totalBankTransactions: number;
    totalRecordedPayments: number;
    matchedCount: number;
    unmatchedBankTransactions: number;
    unmatchedRecordedPayments: number;
    duplicateTransactions: number;
    discrepancyAmount: number;
    reconciliationRate: number;
    autoMatchRate: number;
    averageMatchConfidence: number;
}
export interface ReconciliationReport {
    summary: ReconciliationSummary;
    matchedTransactions: PaymentReconciliationItemData[];
    unmatchedBankTransactions: PaymentReconciliationItemData[];
    unmatchedRecordedPayments: any[];
    duplicates: PaymentReconciliationItemData[];
    discrepancies: Array<{
        type: DiscrepancyType;
        count: number;
        totalAmount: number;
        transactions: PaymentReconciliationItemData[];
    }>;
    recommendations: string[];
}
export declare class PaymentReconciliationService {
    createReconciliation(tenantId: string, userId: string, request: CreateReconciliationRequest): Promise<PaymentReconciliationData>;
    private performAutoMatching;
    private findBestMatch;
    private calculateMatchScore;
    manualMatch(tenantId: string, reconciliationItemId: string, paymentId: string, userId: string, notes?: string): Promise<PaymentReconciliationItemData>;
    unmatchTransaction(tenantId: string, reconciliationItemId: string, userId: string, reason?: string): Promise<PaymentReconciliationItemData>;
    addAdjustment(tenantId: string, reconciliationId: string, adjustment: {
        type: 'BANK_ERROR' | 'RECORDING_ERROR' | 'TIMING_DIFFERENCE' | 'FEE' | 'OTHER';
        amount: number;
        description: string;
        reference?: string;
    }, userId: string): Promise<void>;
    approveReconciliation(tenantId: string, reconciliationId: string, userId: string, notes?: string): Promise<PaymentReconciliationData>;
    rejectReconciliation(tenantId: string, reconciliationId: string, userId: string, reason: string): Promise<PaymentReconciliationData>;
    generateReconciliationReport(tenantId: string, reconciliationId: string): Promise<ReconciliationReport>;
    private getRecordedPayments;
    private getBankTransactions;
    private createReconciliationItems;
    private matchTransaction;
    private updateReconciliationSummary;
    private getDefaultRules;
    private compareReferences;
    private calculateTextSimilarity;
    private getUnmatchedRecordedPayments;
    private generateReconciliationRecommendations;
    private mapReconciliationToData;
    private mapReconciliationItemToData;
    getReconciliations(tenantId: string, filters?: {
        reconciliationType?: ReconciliationType;
        status?: ReconciliationStatus;
        startDate?: Date;
        endDate?: Date;
    }, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        reconciliations: PaymentReconciliationData[];
        total: number;
        hasMore: boolean;
    }>;
    getReconciliationById(tenantId: string, reconciliationId: string): Promise<PaymentReconciliationData | null>;
}
export declare const paymentReconciliationService: PaymentReconciliationService;
//# sourceMappingURL=paymentReconciliationService.d.ts.map