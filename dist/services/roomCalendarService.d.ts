import { BookingStatus, SpaceType } from '@prisma/client';
export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resourceId: string;
    status: BookingStatus;
    userId: string;
    userName: string;
    userEmail: string;
    description?: string;
    color?: string;
    editable: boolean;
    extendedProps: {
        bookingId: string;
        spaceId: string;
        spaceName: string;
        capacity: number;
        cost?: number;
        checkedIn: boolean;
        requiresApproval: boolean;
        approvalStatus?: string;
    };
}
export interface CalendarResource {
    id: string;
    title: string;
    businessHours: Array<{
        daysOfWeek: number[];
        startTime: string;
        endTime: string;
    }>;
    extendedProps: {
        type: SpaceType;
        capacity: number;
        hourlyRate?: number;
        amenities: string[];
        features: Array<{
            name: string;
            category: string;
            quantity: number;
        }>;
        isActive: boolean;
        currentStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_ORDER';
    };
}
export interface CalendarView {
    events: CalendarEvent[];
    resources: CalendarResource[];
    timeZone: string;
    businessHours: Array<{
        daysOfWeek: number[];
        startTime: string;
        endTime: string;
    }>;
    validRange: {
        start: Date;
        end: Date;
    };
}
export interface AvailabilitySlot {
    start: Date;
    end: Date;
    resourceId: string;
    available: boolean;
    price?: number;
    conflicts?: string[];
}
export interface ConflictInfo {
    type: 'BOOKING' | 'MAINTENANCE' | 'AVAILABILITY';
    description: string;
    startTime: Date;
    endTime: Date;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
}
export interface CalendarFilters {
    spaceIds?: string[];
    spaceTypes?: SpaceType[];
    userId?: string;
    status?: BookingStatus[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    showMaintenanceEvents?: boolean;
    showAvailabilityGaps?: boolean;
}
export declare class RoomCalendarService {
    getCalendarView(tenantId: string, startDate: Date, endDate: Date, filters?: CalendarFilters): Promise<CalendarView>;
    getAvailabilityMatrix(tenantId: string, date: Date, spaceIds?: string[], slotDuration?: number): Promise<{
        date: string;
        slots: AvailabilitySlot[];
        summary: {
            totalSlots: number;
            availableSlots: number;
            occupiedSlots: number;
            availabilityRate: number;
        };
    }>;
    getRealtimeCalendarUpdates(tenantId: string, lastUpdateTime: Date, spaceIds?: string[]): Promise<{
        events: {
            created: CalendarEvent[];
            updated: CalendarEvent[];
            deleted: string[];
        };
        resources: {
            updated: CalendarResource[];
        };
        lastUpdateTime: Date;
    }>;
    detectConflicts(tenantId: string, spaceId: string, startTime: Date, endTime: Date, excludeBookingId?: string): Promise<ConflictInfo[]>;
    private getFilteredSpaces;
    private getBookingsForDateRange;
    private getMaintenanceEvents;
    private convertSpacesToResources;
    private convertBookingsToEvents;
    private convertBookingToEvent;
    private convertMaintenanceToEvents;
    private getEventColor;
    private getBusinessHours;
    generateCalendarSummary(tenantId: string, startDate: Date, endDate: Date, spaceIds?: string[]): Promise<{
        period: {
            start: Date;
            end: Date;
        };
        totalBookings: number;
        totalRevenue: number;
        utilizationRate: number;
        mostPopularRoom: {
            id: string;
            name: string;
            bookings: number;
        };
        peakUsageHours: {
            hour: number;
            bookings: number;
        }[];
        upcomingMaintenances: number;
    }>;
}
export declare const roomCalendarService: RoomCalendarService;
//# sourceMappingURL=roomCalendarService.d.ts.map