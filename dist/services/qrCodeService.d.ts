import { QRCodeType } from '@prisma/client';
export interface QRCodeData {
    id: string;
    type: QRCodeType;
    data: string;
    metadata: Record<string, any>;
    expiresAt?: Date;
    isActive: boolean;
    usageCount: number;
    maxUsage?: number;
}
export interface BookingQRCode {
    bookingId: string;
    spaceId: string;
    spaceName: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    qrCode: string;
    qrCodeUrl: string;
    validFrom: Date;
    validUntil: Date;
    canCheckIn: boolean;
    canCheckOut: boolean;
    isExpired: boolean;
}
export interface QRCheckInResult {
    success: boolean;
    checkIn?: {
        id: string;
        bookingId: string;
        userId: string;
        spaceId: string;
        spaceName: string;
        checkedInAt: Date;
        validUntil: Date;
    };
    error?: string;
    validationErrors?: string[];
}
export interface QRCheckOutResult {
    success: boolean;
    checkOut?: {
        id: string;
        checkInId: string;
        checkedOutAt: Date;
        actualDuration: number;
        scheduledDuration: number;
        overtime: number;
    };
    error?: string;
}
export interface QRCodeValidation {
    isValid: boolean;
    qrCodeData?: QRCodeData;
    booking?: any;
    space?: any;
    user?: any;
    errors: string[];
    warnings: string[];
    context: {
        canCheckIn: boolean;
        canCheckOut: boolean;
        isExpired: boolean;
        remainingTime?: number;
        gracePeriod?: number;
    };
}
export declare class QRCodeService {
    generateBookingQRCode(tenantId: string, bookingId: string, options?: {
        validityMinutes?: number;
        maxUsage?: number;
        includeMachineName?: boolean;
    }): Promise<BookingQRCode>;
    generateSpaceAccessQRCode(tenantId: string, spaceId: string, userId: string, validityHours?: number): Promise<string>;
    validateQRCode(qrCodeString: string): Promise<QRCodeValidation>;
    processQRCheckIn(tenantId: string, qrCodeString: string, userId: string, additionalData?: Record<string, any>): Promise<QRCheckInResult>;
    processQRCheckOut(tenantId: string, qrCodeString: string, userId: string, additionalData?: Record<string, any>): Promise<QRCheckOutResult>;
    deactivateQRCode(tenantId: string, qrCodeId: string): Promise<{
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
    getQRCodeUsageHistory(tenantId: string, qrCodeId: string): Promise<{
        userId: string | null;
        tenantId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        deviceInfo: import("@prisma/client/runtime/library").JsonValue | null;
        result: import(".prisma/client").$Enums.ScanResult;
        id: string;
        visitorId: string | null;
        location: string | null;
        qrCodeId: string;
        reason: string | null;
        scannedAt: Date;
    }[]>;
    generateQRCodeAnalytics(tenantId: string, startDate: Date, endDate: Date): Promise<{
        totalScans: number;
        successfulScans: number;
        failedScans: number;
        successRate: number;
        scansByType: Record<string, number>;
        scansBySpace: Array<{
            spaceId: string;
            spaceName: string;
            scans: number;
        }>;
        scansByHour: Array<{
            hour: number;
            scans: number;
        }>;
        topUsers: Array<{
            userId: string;
            userName: string;
            scans: number;
        }>;
    }>;
}
export declare const qrCodeService: QRCodeService;
//# sourceMappingURL=qrCodeService.d.ts.map