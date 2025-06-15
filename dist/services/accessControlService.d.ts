import { QRCodeType, ScanResult } from '@prisma/client';
export interface CreateQRCodeRequest {
    type: QRCodeType;
    userId?: string;
    visitorId?: string;
    validFor: number;
    permissions: string[];
    maxScans?: number;
    metadata?: Record<string, any>;
}
export interface GeneratedQRCode {
    id: string;
    code: string;
    qrImageUrl: string;
    validFrom: Date;
    validUntil: Date;
    type: QRCodeType;
    permissions: string[];
}
export interface ScanQRCodeRequest {
    qrCodeData: string;
    location?: string;
    deviceInfo?: Record<string, any>;
    scannedBy?: string;
}
export interface ScanResultData {
    success: boolean;
    result: ScanResult;
    message: string;
    accessGranted: boolean;
    userInfo?: {
        id: string;
        name: string;
        type: 'USER' | 'VISITOR';
    };
    permissions?: string[];
    violations?: string[];
}
export interface AccessRuleData {
    name: string;
    description?: string;
    zoneId?: string;
    membershipTypes: string[];
    planTypes: string[];
    userRoles: string[];
    timeRestrictions: Record<string, any>;
    dayRestrictions: number[];
    maxOccupancy?: number;
    requiresApproval: boolean;
    priority: number;
    validFrom?: Date;
    validTo?: Date;
}
export interface OccupancyUpdate {
    zoneId?: string;
    spaceId?: string;
    action: 'ENTRY' | 'EXIT';
    timestamp: Date;
}
export declare class AccessControlService {
    private readonly JWT_SECRET;
    private readonly QR_BASE_URL;
    generateQRCode(tenantId: string, data: CreateQRCodeRequest): Promise<GeneratedQRCode>;
    scanQRCode(tenantId: string, scanData: ScanQRCodeRequest): Promise<ScanResultData>;
    createAccessRule(tenantId: string, data: AccessRuleData): Promise<{
        zone: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            restrictions: import("@prisma/client/runtime/library").JsonValue;
            zoneType: import(".prisma/client").$Enums.AccessZoneType;
        } | null;
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        requiresApproval: boolean;
        zoneId: string | null;
        validFrom: Date | null;
        priority: number;
        validTo: Date | null;
        membershipTypes: import("@prisma/client/runtime/library").JsonValue;
        planTypes: import("@prisma/client/runtime/library").JsonValue;
        userRoles: import("@prisma/client/runtime/library").JsonValue;
        timeRestrictions: import("@prisma/client/runtime/library").JsonValue;
        dayRestrictions: import("@prisma/client/runtime/library").JsonValue;
        maxOccupancy: number | null;
    }>;
    getAccessRules(tenantId: string, zoneId?: string): Promise<({
        zone: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            restrictions: import("@prisma/client/runtime/library").JsonValue;
            zoneType: import(".prisma/client").$Enums.AccessZoneType;
        } | null;
    } & {
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        requiresApproval: boolean;
        zoneId: string | null;
        validFrom: Date | null;
        priority: number;
        validTo: Date | null;
        membershipTypes: import("@prisma/client/runtime/library").JsonValue;
        planTypes: import("@prisma/client/runtime/library").JsonValue;
        userRoles: import("@prisma/client/runtime/library").JsonValue;
        timeRestrictions: import("@prisma/client/runtime/library").JsonValue;
        dayRestrictions: import("@prisma/client/runtime/library").JsonValue;
        maxOccupancy: number | null;
    })[]>;
    updateOccupancy(tenantId: string, update: OccupancyUpdate): Promise<{
        tenantId: string;
        id: string;
        updatedAt: Date;
        spaceId: string | null;
        zoneId: string | null;
        currentCount: number;
        maxCapacity: number;
        lastEntry: Date | null;
        lastExit: Date | null;
        peakToday: number;
        peakThisWeek: number;
        peakThisMonth: number;
    }>;
    getCurrentOccupancy(tenantId: string, zoneId?: string, spaceId?: string): Promise<({
        space: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            type: import(".prisma/client").$Enums.SpaceType;
            capacity: number;
            amenities: import("@prisma/client/runtime/library").JsonValue | null;
            hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
            isActive: boolean;
        } | null;
        zone: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            restrictions: import("@prisma/client/runtime/library").JsonValue;
            zoneType: import(".prisma/client").$Enums.AccessZoneType;
        } | null;
    } & {
        tenantId: string;
        id: string;
        updatedAt: Date;
        spaceId: string | null;
        zoneId: string | null;
        currentCount: number;
        maxCapacity: number;
        lastEntry: Date | null;
        lastExit: Date | null;
        peakToday: number;
        peakThisWeek: number;
        peakThisMonth: number;
    })[]>;
    private validateAccessRules;
    private logScanAttempt;
    private updateQRCodeStatus;
    private parseTime;
    getUserQRCodes(tenantId: string, userId: string): Promise<{
        userId: string | null;
        tenantId: string;
        code: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        status: import(".prisma/client").$Enums.QRCodeStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.QRCodeType;
        visitorId: string | null;
        validFrom: Date;
        validUntil: Date;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        maxScans: number | null;
        currentScans: number;
        lastUsedAt: Date | null;
    }[]>;
    revokeQRCode(tenantId: string, qrCodeId: string, revokedBy: string): Promise<{
        userId: string | null;
        tenantId: string;
        code: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        id: string;
        status: import(".prisma/client").$Enums.QRCodeStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.QRCodeType;
        visitorId: string | null;
        validFrom: Date;
        validUntil: Date;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        maxScans: number | null;
        currentScans: number;
        lastUsedAt: Date | null;
    }>;
    getAccessLogs(tenantId: string, filters?: {
        userId?: string;
        visitorId?: string;
        zoneId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<({
        user: {
            tenantId: string;
            phone: string | null;
            twoFactorSecret: string | null;
            twoFactorBackupCodes: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            clientId: string | null;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            email: string;
            supabaseId: string;
            avatar: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            lastLoginAt: Date | null;
            twoFactorEnabled: boolean;
            lastTwoFactorVerified: Date | null;
        } | null;
        visitor: {
            tenantId: string;
            phone: string | null;
            id: string;
            status: import(".prisma/client").$Enums.VisitorStatus;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            email: string | null;
            company: string | null;
            jobTitle: string | null;
            photoUrl: string | null;
            documentType: string | null;
            documentNumber: string | null;
            hostUserId: string;
            purpose: import(".prisma/client").$Enums.VisitorPurpose;
            purposeDetails: string | null;
            expectedDuration: number | null;
            meetingRoom: string | null;
            qrCode: string;
            badgeNumber: string | null;
            validFrom: Date;
            validUntil: Date;
            accessZones: import("@prisma/client/runtime/library").JsonValue | null;
            checkedInAt: Date | null;
            checkedOutAt: Date | null;
            actualDuration: number | null;
            preRegistrationId: string | null;
            isPreRegistered: boolean;
            healthDeclaration: import("@prisma/client/runtime/library").JsonValue | null;
            emergencyContact: import("@prisma/client/runtime/library").JsonValue | null;
            ndaSigned: boolean;
            ndaSignedAt: Date | null;
            termsAccepted: boolean;
            dataConsent: boolean;
        } | null;
        zone: {
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            restrictions: import("@prisma/client/runtime/library").JsonValue;
            zoneType: import(".prisma/client").$Enums.AccessZoneType;
        } | null;
    } & {
        timestamp: Date;
        userId: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        visitorId: string | null;
        zoneId: string | null;
        action: import(".prisma/client").$Enums.AccessAction;
        location: string | null;
    })[]>;
}
export declare const accessControlService: AccessControlService;
//# sourceMappingURL=accessControlService.d.ts.map