import { VisitorStatus, VisitorPurpose, PreRegistrationStatus, VisitorAction, AccessCodeType, CodeStatus } from '@prisma/client';
export interface VisitorData {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    photoUrl?: string;
    documentType?: string;
    documentNumber?: string;
    hostUserId: string;
    hostName: string;
    hostEmail: string;
    purpose: VisitorPurpose;
    purposeDetails?: string;
    expectedDuration?: number;
    meetingRoom?: string;
    qrCode: string;
    badgeNumber?: string;
    validFrom: Date;
    validUntil: Date;
    accessZones: string[];
    status: VisitorStatus;
    checkedInAt?: Date;
    checkedOutAt?: Date;
    actualDuration?: number;
    isPreRegistered: boolean;
    healthDeclaration?: Record<string, any>;
    emergencyContact?: Record<string, any>;
    ndaSigned: boolean;
    termsAccepted: boolean;
    dataConsent: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateVisitorRequest {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    documentType?: string;
    documentNumber?: string;
    hostUserId: string;
    purpose: VisitorPurpose;
    purposeDetails?: string;
    expectedDuration?: number;
    meetingRoom?: string;
    validFrom?: Date;
    validUntil?: Date;
    accessZones?: string[];
    preRegistrationId?: string;
    healthDeclaration?: Record<string, any>;
    emergencyContact?: Record<string, any>;
}
export interface UpdateVisitorRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    photoUrl?: string;
    documentType?: string;
    documentNumber?: string;
    purpose?: VisitorPurpose;
    purposeDetails?: string;
    expectedDuration?: number;
    meetingRoom?: string;
    validUntil?: Date;
    accessZones?: string[];
    healthDeclaration?: Record<string, any>;
    emergencyContact?: Record<string, any>;
}
export interface VisitorFilter {
    status?: VisitorStatus[];
    hostUserId?: string;
    purpose?: VisitorPurpose;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    includeExpired?: boolean;
}
export interface CheckInRequest {
    visitorId: string;
    checkInLocation?: string;
    photoUrl?: string;
    badgeNumber?: string;
    healthDeclaration?: Record<string, any>;
    termsAccepted?: boolean;
    dataConsent?: boolean;
    ndaSigned?: boolean;
}
export interface CheckOutRequest {
    visitorId: string;
    checkOutLocation?: string;
    badgeReturned?: boolean;
    notes?: string;
}
export interface VisitorStatistics {
    totalVisitors: number;
    activeVisitors: number;
    todaysVisitors: number;
    averageVisitDuration: number;
    byPurpose: Array<{
        purpose: VisitorPurpose;
        count: number;
        percentage: number;
    }>;
    byStatus: Array<{
        status: VisitorStatus;
        count: number;
    }>;
    peakHours: Array<{
        hour: number;
        visitorCount: number;
    }>;
    topHosts: Array<{
        hostId: string;
        hostName: string;
        visitorCount: number;
    }>;
}
export interface AccessCodeData {
    id: string;
    code: string;
    codeType: AccessCodeType;
    visitorId?: string;
    isActive: boolean;
    expiresAt: Date;
    maxUses?: number;
    currentUses: number;
    accessZones?: string[];
    generatedBy: string;
    generatedAt: Date;
    lastUsedAt?: Date;
    status: CodeStatus;
}
export interface CreateAccessCodeRequest {
    codeType: AccessCodeType;
    visitorId?: string;
    expiresAt: Date;
    maxUses?: number;
    accessZones?: string[];
    generatedFor?: string;
    timeRestrictions?: any;
    ipRestrictions?: string[];
}
export interface PreRegistrationData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    expectedArrival: Date;
    purpose: VisitorPurpose;
    purposeDetails?: string;
    hostUserId: string;
    status: PreRegistrationStatus;
    isApproved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    invitationSent: boolean;
    createdAt: Date;
    expiresAt: Date;
}
export interface PreRegistrationRequest {
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
    customRequirements?: any[];
}
export declare class VisitorService {
    createVisitor(tenantId: string, data: CreateVisitorRequest): Promise<VisitorData>;
    updateVisitor(tenantId: string, visitorId: string, data: UpdateVisitorRequest): Promise<VisitorData>;
    deleteVisitor(tenantId: string, visitorId: string): Promise<void>;
    getVisitorById(tenantId: string, visitorId: string): Promise<VisitorData | null>;
    getVisitorByQRCode(tenantId: string, qrCode: string): Promise<VisitorData | null>;
    getVisitors(tenantId: string, filters?: VisitorFilter, pagination?: {
        skip?: number;
        take?: number;
    }): Promise<{
        visitors: VisitorData[];
        total: number;
        hasMore: boolean;
    }>;
    getTodaysVisitors(tenantId: string, hostUserId?: string): Promise<VisitorData[]>;
    getActiveVisitors(tenantId: string): Promise<VisitorData[]>;
    checkInVisitor(tenantId: string, data: CheckInRequest): Promise<VisitorData>;
    checkOutVisitor(tenantId: string, data: CheckOutRequest): Promise<VisitorData>;
    extendVisitorStay(tenantId: string, visitorId: string, newValidUntil: Date, reason?: string): Promise<VisitorData>;
    getVisitorStatistics(tenantId: string, startDate: Date, endDate: Date): Promise<VisitorStatistics>;
    getVisitorHistory(tenantId: string, visitorId: string): Promise<Array<{
        action: VisitorAction;
        timestamp: Date;
        performedBy?: string;
        location?: string;
        details?: string;
    }>>;
    private buildVisitorWhereClause;
    private mapVisitorToData;
    updateExpiredVisitors(tenantId: string): Promise<number>;
    createPreRegistration(tenantId: string, userId: string, request: PreRegistrationRequest): Promise<PreRegistrationData>;
    approvePreRegistration(tenantId: string, preRegistrationId: string, userId: string, approvalNotes?: string): Promise<PreRegistrationData>;
    convertPreRegistrationToVisitor(tenantId: string, preRegistrationId: string, userId: string): Promise<VisitorData>;
    generateAccessCode(tenantId: string, userId: string, request: CreateAccessCodeRequest): Promise<AccessCodeData>;
    validateAccessCode(tenantId: string, code: string, location?: string, ipAddress?: string): Promise<{
        valid: boolean;
        accessCode?: AccessCodeData;
        reason?: string;
    }>;
    useAccessCode(tenantId: string, code: string, usedBy?: string, visitorId?: string, location?: string, ipAddress?: string, deviceInfo?: any): Promise<{
        success: boolean;
        reason?: string;
    }>;
    private sendNotification;
    private sendVisitorInvitation;
    private generateQRCode;
    private generateAlphanumericCode;
    private checkTimeRestrictions;
    private deactivateAccessCode;
    private mapPreRegistrationToData;
    private mapAccessCodeToData;
}
export declare const visitorService: VisitorService;
//# sourceMappingURL=visitorService.d.ts.map