import { RequestStatus, RequestPriority } from '@prisma/client';
export interface WorkflowState {
    value: RequestStatus;
    context: {
        requestId: string;
        serviceId: string;
        userId: string;
        requiresApproval: boolean;
        priority: RequestPriority;
        assignedTo?: string;
        approvedBy?: string;
        metadata: Record<string, any>;
    };
}
export interface WorkflowEvent {
    type: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'ASSIGN' | 'START' | 'COMPLETE' | 'CANCEL' | 'HOLD' | 'RESUME';
    userId: string;
    data?: Record<string, any>;
}
export interface StateTransition {
    from: RequestStatus;
    to: RequestStatus;
    event: WorkflowEvent['type'];
    guard?: (context: WorkflowState['context'], event: WorkflowEvent) => boolean;
    action?: (context: WorkflowState['context'], event: WorkflowEvent) => Promise<void>;
}
export interface WorkflowRule {
    name: string;
    description: string;
    condition: (context: WorkflowState['context']) => boolean;
    actions: Array<{
        type: 'AUTO_APPROVE' | 'AUTO_ASSIGN' | 'PRIORITY_ESCALATION' | 'NOTIFICATION';
        parameters: Record<string, any>;
    }>;
}
export declare class ServiceWorkflowService {
    private transitions;
    private rules;
    constructor();
    private initializeTransitions;
    private initializeRules;
    processEvent(currentState: WorkflowState, event: WorkflowEvent): Promise<{
        newState: WorkflowState;
        actions: Array<{
            type: string;
            parameters: Record<string, any>;
        }>;
        success: boolean;
        error?: string;
    }>;
    validateTransition(currentState: RequestStatus, event: WorkflowEvent): Promise<{
        valid: boolean;
        error?: string;
        nextState?: RequestStatus;
    }>;
    getAvailableActions(currentState: RequestStatus, userId: string, context?: WorkflowState['context']): Array<{
        action: WorkflowEvent['type'];
        label: string;
        description: string;
        requiresPermission?: string;
    }>;
    private applyRules;
    private findTransition;
    private canApprove;
    private canAssign;
    private canStart;
    private canComplete;
    private canHold;
    private canResume;
    private canCancel;
    private getActionLabel;
    private getActionDescription;
    private getRequiredPermission;
    getWorkflowMetrics(tenantId: string, startDate: Date, endDate: Date): Promise<{
        totalTransitions: number;
        transitionsByType: Record<string, number>;
        averageProcessingTime: Record<RequestStatus, number>;
        bottlenecks: Array<{
            state: RequestStatus;
            averageTime: number;
            requestCount: number;
        }>;
        ruleEffectiveness: Array<{
            ruleName: string;
            triggerCount: number;
            successRate: number;
        }>;
    }>;
}
export declare const serviceWorkflowService: ServiceWorkflowService;
//# sourceMappingURL=serviceWorkflowService.d.ts.map