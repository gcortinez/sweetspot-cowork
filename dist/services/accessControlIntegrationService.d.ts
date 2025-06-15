import { ScanResult, ViolationType, ViolationSeverity } from '@prisma/client';
export interface AccessAttempt {
    tenantId: string;
    userId?: string;
    visitorId?: string;
    accessType: 'QR_CODE' | 'ACCESS_CODE' | 'BADGE' | 'MANUAL';
    accessData: string;
    location?: string;
    accessPoint?: string;
    deviceInfo?: any;
    ipAddress?: string;
    userAgent?: string;
}
export interface AccessResult {
    success: boolean;
    accessGranted: boolean;
    result: ScanResult;
    reason?: string;
    visitor?: any;
    accessZones?: string[];
    validUntil?: Date;
    restrictions?: any;
}
export interface AccessPolicy {
    tenantId: string;
    name: string;
    description?: string;
    rules: AccessPolicyRule[];
    priority: number;
    isActive: boolean;
}
export interface AccessPolicyRule {
    type: 'TIME_BASED' | 'ZONE_BASED' | 'ROLE_BASED' | 'VISITOR_TYPE';
    conditions: any;
    action: 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL';
    message?: string;
}
export interface AccessViolationData {
    id: string;
    tenantId: string;
    userId?: string;
    visitorId?: string;
    violationType: ViolationType;
    description: string;
    severity: ViolationSeverity;
    location?: string;
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    metadata: any;
    createdAt: Date;
}
export interface CheckInData {
    visitorId: string;
    location?: string;
    accessPoint?: string;
    badgeNumber?: string;
    photoUrl?: string;
    verificationMethod: 'QR_CODE' | 'ACCESS_CODE' | 'MANUAL';
    verificationData?: string;
    healthDeclaration?: any;
    emergencyContact?: any;
    termsAccepted?: boolean;
    dataConsent?: boolean;
}
export interface CheckOutData {
    visitorId: string;
    location?: string;
    accessPoint?: string;
    badgeReturned?: boolean;
    feedback?: string;
    rating?: number;
    notes?: string;
}
declare class AccessControlIntegrationService {
    verifyAccess(tenantId: string, attempt: AccessAttempt): Promise<AccessResult>;
    private verifyQRCodeAccess;
    private verifyAccessCodeAccess;
    private verifyBadgeAccess;
    private verifyManualAccess;
    processCheckIn(tenantId: string, data: CheckInData, performedBy?: string): Promise<{
        success: boolean;
        visitor?: any;
        reason?: string;
    }>;
    processCheckOut(tenantId: string, data: CheckOutData, performedBy?: string): Promise<{
        success: boolean;
        visitor?: any;
        reason?: string;
    }>;
    private checkZoneAccess;
    private checkVisitorPolicies;
    private handleAccessViolation;
    private logAccessAttempt;
    private logVisitorAction;
    private recordVisitorFeedback;
    syncWithAccessControlSystem(tenantId: string, systemType: 'CARD_READER' | 'TURNSTILE' | 'DOOR_LOCK' | 'GATE', deviceId: string, eventData: any): Promise<{
        success: boolean;
        action?: string;
        reason?: string;
    }>;
    private mapSystemEventToAccessType;
    getAccessControlMetrics(tenantId: string, startDate: Date, endDate: Date): Promise<{
        totalAttempts: number;
        successfulAccess: number;
        deniedAccess: number;
        violations: number;
        averageAccessTime: number;
        peakAccessHours: Array<{
            hour: number;
            count: number;
        }>;
        accessByType: Array<{
            type: string;
            count: number;
        }>;
        violationsByType: Array<{
            type: ViolationType;
            count: number;
            severity: ViolationSeverity;
        }>;
    }>;
}
export declare const accessControlIntegrationService: AccessControlIntegrationService;
export {};
//# sourceMappingURL=accessControlIntegrationService.d.ts.map