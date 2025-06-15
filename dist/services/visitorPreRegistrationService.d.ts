import { PreRegistrationStatus, VisitorPurpose } from '@prisma/client';
export interface PreRegistrationData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    hostUserId: string;
    hostName: string;
    hostEmail: string;
    expectedArrival: Date;
    expectedDuration?: number;
    purpose: VisitorPurpose;
    purposeDetails?: string;
    meetingRoom?: string;
    isApproved: boolean;
    approvedBy?: string;
    approverName?: string;
    approvedAt?: Date;
    approvalNotes?: string;
    accessZones: string[];
    parkingRequired: boolean;
    parkingSpot?: string;
    invitationSent: boolean;
    invitationSentAt?: Date;
    reminderSent: boolean;
    requiresNDA: boolean;
    requiresHealthCheck: boolean;
    customRequirements: string[];
    status: PreRegistrationStatus;
    visitDate?: Date;
    visitorId?: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}
export interface CreatePreRegistrationRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    hostUserId: string;
    expectedArrival: Date;
    expectedDuration?: number;
    purpose: VisitorPurpose;
    purposeDetails?: string;
    meetingRoom?: string;
    accessZones?: string[];
    parkingRequired?: boolean;
    requiresNDA?: boolean;
    requiresHealthCheck?: boolean;
    customRequirements?: string[];
    autoApprove?: boolean;
}
export interface UpdatePreRegistrationRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    expectedArrival?: Date;
    expectedDuration?: number;
    purpose?: VisitorPurpose;
    purposeDetails?: string;
    meetingRoom?: string;
    accessZones?: string[];
    parkingRequired?: boolean;
    parkingSpot?: string;
    requiresNDA?: boolean;
    requiresHealthCheck?: boolean;
    customRequirements?: string[];
}
export interface ApprovalRequest {
    approve: boolean;
    notes?: string;
    accessZones?: string[];
    parkingSpot?: string;
    customRequirements?: string[];
}
export interface PreRegistrationFilter {
    status?: PreRegistrationStatus[];
    hostUserId?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    pendingOnly?: boolean;
}
export interface InvitationRequest {
    preRegistrationId: string;
    message?: string;
    includeQRCode?: boolean;
    includeDirections?: boolean;
    includeParking?: boolean;
}
export interface PreRegistrationStatistics {
    totalPreRegistrations: number;
    pendingApproval: number;
    approvedToday: number;
    conversionRate: number;
    averageApprovalTime: number;
    byPurpose: Array<{
        purpose: VisitorPurpose;
        count: number;
    }>;
    byHost: Array<{
        hostId: string;
        hostName: string;
        count: number;
    }>;
    upcomingVisits: Array<{
        date: string;
        count: number;
    }>;
}
export declare class VisitorPreRegistrationService {
    createPreRegistration(tenantId: string, data: CreatePreRegistrationRequest): Promise<PreRegistrationData>;
    updatePreRegistration(tenantId: string, preRegistrationId: string, data: UpdatePreRegistrationRequest): Promise<PreRegistrationData>;
    deletePreRegistration(tenantId: string, preRegistrationId: string): Promise<void>;
    getPreRegistrationById(tenantId: string, preRegistrationId: string): Promise<PreRegistrationData | null>;
    getPreRegistrations(tenantId: string, filters?: PreRegistrationFilter, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        preRegistrations: PreRegistrationData[];
        total: number;
        hasMore: boolean;
    }>;
    getPendingApprovals(tenantId: string, hostUserId?: string): Promise<PreRegistrationData[]>;
    getUpcomingVisits(tenantId: string, hostUserId?: string, days?: number): Promise<PreRegistrationData[]>;
    processApproval(tenantId: string, preRegistrationId: string, approverId: string, data: ApprovalRequest): Promise<PreRegistrationData>;
    sendInvitation(tenantId: string, data: InvitationRequest): Promise<{
        success: boolean;
        message: string;
        invitationId?: string;
    }>;
    sendReminder(tenantId: string, preRegistrationId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    convertToVisitor(tenantId: string, preRegistrationId: string, additionalData?: {
        photoUrl?: string;
        documentType?: string;
        documentNumber?: string;
        healthDeclaration?: Record<string, any>;
        emergencyContact?: Record<string, any>;
    }): Promise<{
        success: boolean;
        visitor?: any;
        error?: string;
    }>;
    getPreRegistrationStatistics(tenantId: string, startDate: Date, endDate: Date): Promise<PreRegistrationStatistics>;
    cleanupExpiredPreRegistrations(tenantId: string): Promise<number>;
    private buildPreRegistrationWhereClause;
    private mapPreRegistrationToData;
    private generateInvitationContent;
}
export declare const visitorPreRegistrationService: VisitorPreRegistrationService;
//# sourceMappingURL=visitorPreRegistrationService.d.ts.map