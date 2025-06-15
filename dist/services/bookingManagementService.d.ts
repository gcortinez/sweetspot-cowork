import { BookingStatus } from '@prisma/client';
export interface CreateBookingRequest {
    spaceId: string;
    userId: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    requiresApproval?: boolean;
}
export interface UpdateBookingRequest {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
}
export interface BookingFilters {
    spaceId?: string;
    userId?: string;
    status?: BookingStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export interface ApprovalRequest {
    bookingId: string;
    approverId: string;
    status: 'approve' | 'reject';
    reason?: string;
    notes?: string;
}
export interface CheckInRequest {
    bookingId: string;
    userId: string;
    qrCodeUsed?: string;
    notes?: string;
}
export interface CheckOutRequest {
    checkInId: string;
    actualEndTime?: Date;
    notes?: string;
}
export declare class BookingManagementService {
    createBooking(tenantId: string, request: CreateBookingRequest): Promise<{
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
        };
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
        };
    } & {
        userId: string;
        tenantId: string;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        spaceId: string;
        startTime: Date;
        endTime: Date;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    updateBooking(tenantId: string, bookingId: string, userId: string, updates: UpdateBookingRequest): Promise<{
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
        };
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
        };
        approval: {
            tenantId: string;
            id: string;
            status: import(".prisma/client").$Enums.ApprovalStatus;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            reason: string | null;
            bookingId: string;
            approverId: string | null;
            requestedAt: Date;
            reviewedAt: Date | null;
        } | null;
    } & {
        userId: string;
        tenantId: string;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        spaceId: string;
        startTime: Date;
        endTime: Date;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    cancelBooking(tenantId: string, bookingId: string, userId: string, reason?: string): Promise<{
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
        };
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
        };
    } & {
        userId: string;
        tenantId: string;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        spaceId: string;
        startTime: Date;
        endTime: Date;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    getBookings(tenantId: string, filters?: BookingFilters): Promise<{
        bookings: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            };
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
            };
            checkIns: {
                userId: string;
                tenantId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                spaceId: string;
                checkedInAt: Date;
                checkedOutAt: Date | null;
                bookingId: string;
                qrCodeUsed: string | null;
                actualEndTime: Date | null;
            }[];
            approval: {
                tenantId: string;
                id: string;
                status: import(".prisma/client").$Enums.ApprovalStatus;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                reason: string | null;
                bookingId: string;
                approverId: string | null;
                requestedAt: Date;
                reviewedAt: Date | null;
            } | null;
        } & {
            userId: string;
            tenantId: string;
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            spaceId: string;
            startTime: Date;
            endTime: Date;
            cost: import("@prisma/client/runtime/library").Decimal | null;
        })[];
        total: number;
        hasMore: boolean;
    }>;
    getBookingById(tenantId: string, bookingId: string): Promise<({
        user: {
            phone: string | null;
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        space: {
            features: ({
                feature: {
                    tenantId: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    isActive: boolean;
                    category: import(".prisma/client").$Enums.FeatureCategory;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                spaceId: string;
                quantity: number;
                featureId: string;
                isWorking: boolean;
            })[];
        } & {
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
        };
        checkIns: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            userId: string;
            tenantId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            spaceId: string;
            checkedInAt: Date;
            checkedOutAt: Date | null;
            bookingId: string;
            qrCodeUsed: string | null;
            actualEndTime: Date | null;
        })[];
        approval: ({
            approver: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            } | null;
        } & {
            tenantId: string;
            id: string;
            status: import(".prisma/client").$Enums.ApprovalStatus;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            reason: string | null;
            bookingId: string;
            approverId: string | null;
            requestedAt: Date;
            reviewedAt: Date | null;
        }) | null;
    } & {
        userId: string;
        tenantId: string;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        spaceId: string;
        startTime: Date;
        endTime: Date;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }) | null>;
    processBookingApproval(tenantId: string, request: ApprovalRequest): Promise<{
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
        };
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
        };
        approval: {
            tenantId: string;
            id: string;
            status: import(".prisma/client").$Enums.ApprovalStatus;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            reason: string | null;
            bookingId: string;
            approverId: string | null;
            requestedAt: Date;
            reviewedAt: Date | null;
        } | null;
    } & {
        userId: string;
        tenantId: string;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        spaceId: string;
        startTime: Date;
        endTime: Date;
        cost: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    getPendingApprovals(tenantId: string, approverId?: string): Promise<({
        booking: {
            user: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
            };
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
            };
        } & {
            userId: string;
            tenantId: string;
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            spaceId: string;
            startTime: Date;
            endTime: Date;
            cost: import("@prisma/client/runtime/library").Decimal | null;
        };
    } & {
        tenantId: string;
        id: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        reason: string | null;
        bookingId: string;
        approverId: string | null;
        requestedAt: Date;
        reviewedAt: Date | null;
    })[]>;
    checkIn(tenantId: string, request: CheckInRequest): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
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
        };
        booking: {
            userId: string;
            tenantId: string;
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            spaceId: string;
            startTime: Date;
            endTime: Date;
            cost: import("@prisma/client/runtime/library").Decimal | null;
        };
    } & {
        userId: string;
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        spaceId: string;
        checkedInAt: Date;
        checkedOutAt: Date | null;
        bookingId: string;
        qrCodeUsed: string | null;
        actualEndTime: Date | null;
    }>;
    checkOut(tenantId: string, request: CheckOutRequest): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
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
        };
        booking: {
            userId: string;
            tenantId: string;
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            spaceId: string;
            startTime: Date;
            endTime: Date;
            cost: import("@prisma/client/runtime/library").Decimal | null;
        };
    } & {
        userId: string;
        tenantId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        spaceId: string;
        checkedInAt: Date;
        checkedOutAt: Date | null;
        bookingId: string;
        qrCodeUsed: string | null;
        actualEndTime: Date | null;
    }>;
    private shouldRequireApproval;
    getBookingStatistics(tenantId: string, spaceId?: string, startDate?: Date, endDate?: Date): Promise<{
        totalBookings: number;
        confirmedBookings: number;
        cancelledBookings: number;
        pendingApprovals: number;
        noShows: number;
        revenue: number;
        confirmationRate: number;
        cancellationRate: number;
        noShowRate: number;
    }>;
}
export declare const bookingManagementService: BookingManagementService;
//# sourceMappingURL=bookingManagementService.d.ts.map