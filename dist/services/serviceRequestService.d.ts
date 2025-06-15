import { RequestPriority, RequestStatus } from '@prisma/client';
export interface ServiceRequestItem {
    id: string;
    serviceId: string;
    serviceName: string;
    serviceCategory: string;
    userId: string;
    userName: string;
    userEmail: string;
    requestedBy: string;
    quantity: number;
    totalAmount: number;
    priority: RequestPriority;
    status: RequestStatus;
    requestedDeliveryTime?: Date;
    scheduledDeliveryTime?: Date;
    actualDeliveryTime?: Date;
    notes?: string;
    customizations: Record<string, any>;
    attachments: string[];
    requiresApproval: boolean;
    approvedBy?: string;
    approverName?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    assignedTo?: string;
    assigneeName?: string;
    progressNotes?: string;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    estimatedDeliveryTime?: string;
    statusHistory: Array<{
        status: RequestStatus;
        changedBy: string;
        changedByName: string;
        reason?: string;
        notes?: string;
        timestamp: Date;
    }>;
}
export interface CreateServiceRequestData {
    serviceId: string;
    userId: string;
    quantity?: number;
    priority?: RequestPriority;
    requestedDeliveryTime?: Date;
    notes?: string;
    customizations?: Record<string, any>;
    attachments?: string[];
}
export interface UpdateServiceRequestData {
    quantity?: number;
    priority?: RequestPriority;
    requestedDeliveryTime?: Date;
    scheduledDeliveryTime?: Date;
    notes?: string;
    customizations?: Record<string, any>;
    attachments?: string[];
    progressNotes?: string;
}
export interface ProcessApprovalData {
    approve: boolean;
    reason?: string;
    notes?: string;
    scheduledDeliveryTime?: Date;
}
export interface AssignRequestData {
    assignedTo: string;
    notes?: string;
}
export interface UpdateProgressData {
    progressNotes: string;
    attachments?: string[];
}
export interface CompleteRequestData {
    actualDeliveryTime?: Date;
    notes?: string;
    attachments?: string[];
}
export interface ServiceRequestFilters {
    status?: RequestStatus[];
    priority?: RequestPriority[];
    serviceId?: string;
    userId?: string;
    assignedTo?: string;
    approvedBy?: string;
    requiresApproval?: boolean;
    startDate?: Date;
    endDate?: Date;
    search?: string;
}
export interface ServiceRequestStats {
    total: number;
    byStatus: Array<{
        status: RequestStatus;
        count: number;
        percentage: number;
    }>;
    byPriority: Array<{
        priority: RequestPriority;
        count: number;
        percentage: number;
    }>;
    averageProcessingTime: number;
    completionRate: number;
    pendingApprovals: number;
    overdueRequests: number;
}
export declare class ServiceRequestService {
    createServiceRequest(tenantId: string, data: CreateServiceRequestData): Promise<ServiceRequestItem>;
    updateServiceRequest(tenantId: string, requestId: string, userId: string, data: UpdateServiceRequestData): Promise<ServiceRequestItem>;
    cancelServiceRequest(tenantId: string, requestId: string, userId: string, reason?: string): Promise<ServiceRequestItem>;
    getServiceRequestById(tenantId: string, requestId: string): Promise<ServiceRequestItem | null>;
    processApproval(tenantId: string, requestId: string, approverId: string, data: ProcessApprovalData): Promise<ServiceRequestItem>;
    assignServiceRequest(tenantId: string, requestId: string, assignerId: string, data: AssignRequestData): Promise<ServiceRequestItem>;
    updateProgress(tenantId: string, requestId: string, userId: string, data: UpdateProgressData): Promise<ServiceRequestItem>;
    completeServiceRequest(tenantId: string, requestId: string, userId: string, data: CompleteRequestData): Promise<ServiceRequestItem>;
    putOnHold(tenantId: string, requestId: string, userId: string, reason: string): Promise<ServiceRequestItem>;
    resumeFromHold(tenantId: string, requestId: string, userId: string, reason?: string): Promise<ServiceRequestItem>;
    getServiceRequests(tenantId: string, filters?: ServiceRequestFilters, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        requests: ServiceRequestItem[];
        total: number;
        hasMore: boolean;
    }>;
    getMyServiceRequests(tenantId: string, userId: string, filters?: Omit<ServiceRequestFilters, 'userId'>): Promise<ServiceRequestItem[]>;
    getPendingApprovals(tenantId: string, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        requests: ServiceRequestItem[];
        total: number;
        hasMore: boolean;
    }>;
    getAssignedRequests(tenantId: string, userId: string, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        requests: ServiceRequestItem[];
        total: number;
        hasMore: boolean;
    }>;
    getServiceRequestStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<ServiceRequestStats>;
    private updateRequestStatus;
    private calculateTotalAmount;
    private buildRequestWhereClause;
    private mapRequestToItem;
}
export declare const serviceRequestService: ServiceRequestService;
//# sourceMappingURL=serviceRequestService.d.ts.map