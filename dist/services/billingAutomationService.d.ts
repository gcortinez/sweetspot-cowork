export interface AutomationRule {
    id: string;
    name: string;
    description: string;
    trigger: 'schedule' | 'event' | 'threshold';
    conditions: Record<string, any>;
    actions: Array<{
        type: 'generate_invoice' | 'send_reminder' | 'suspend_service' | 'collect_payment' | 'send_notification';
        parameters: Record<string, any>;
    }>;
    isActive: boolean;
}
export interface BillingJob {
    id: string;
    type: 'invoice_generation' | 'payment_collection' | 'subscription_renewal' | 'usage_processing' | 'dunning';
    tenantId: string;
    scheduledFor: Date;
    data: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed';
    attempts: number;
    maxAttempts: number;
    lastAttempt?: Date;
    error?: string;
    result?: Record<string, any>;
}
export interface BillingWorkflowResult {
    success: boolean;
    jobsCreated: number;
    invoicesGenerated: number;
    paymentsProcessed: number;
    errors: string[];
    warnings: string[];
}
export declare class BillingAutomationService {
    private billingService;
    constructor();
    runInvoiceGenerationWorkflow(tenantId: string): Promise<BillingWorkflowResult>;
    runPaymentCollectionWorkflow(tenantId: string): Promise<BillingWorkflowResult>;
    runSubscriptionMaintenanceWorkflow(tenantId: string): Promise<BillingWorkflowResult>;
    runDunningWorkflow(tenantId: string): Promise<BillingWorkflowResult>;
    runUsageProcessingWorkflow(tenantId: string): Promise<BillingWorkflowResult>;
    runAllAutomationWorkflows(tenantId: string): Promise<Record<string, BillingWorkflowResult>>;
    scheduleAutomationJob(job: Omit<BillingJob, 'id'>): Promise<string>;
    private processJob;
    private calculateNextBillingDate;
    private getDaysPastDue;
    private renewSubscription;
    private executeDunningAction;
    private shouldGenerateUsageInvoice;
    private generateUsageInvoice;
    private generateInvoiceNumber;
    private schedulePaymentCollection;
    private schedulePaymentRetry;
    private sendInvoiceNotification;
}
export declare const billingAutomationService: BillingAutomationService;
//# sourceMappingURL=billingAutomationService.d.ts.map