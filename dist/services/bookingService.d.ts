import { BookingStatus } from '@prisma/client';
export interface CreateBookingData {
    spaceId: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
    equipment?: string[];
    catering?: boolean;
    notes?: string;
}
export interface UpdateBookingData {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    status?: BookingStatus;
    attendees?: string[];
    equipment?: string[];
    catering?: boolean;
    notes?: string;
}
export interface BookingWithDetails {
    id: string;
    tenantId: string;
    spaceId: string;
    userId: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    status: BookingStatus;
    cost?: number;
    attendees?: string[];
    equipment?: string[];
    catering?: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    space?: any;
    user?: any;
}
export interface BookingFilters {
    userId?: string;
    spaceId?: string;
    status?: BookingStatus[];
    startDate?: Date;
    endDate?: Date;
    upcoming?: boolean;
}
export declare class BookingService {
    createBooking(tenantId: string, userId: string, data: CreateBookingData): Promise<BookingWithDetails>;
    getBookings(tenantId: string, filters?: BookingFilters, page?: number, limit?: number): Promise<{
        bookings: BookingWithDetails[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getBookingById(tenantId: string, bookingId: string): Promise<BookingWithDetails | null>;
    updateBooking(tenantId: string, bookingId: string, userId: string, data: UpdateBookingData): Promise<BookingWithDetails>;
    cancelBooking(tenantId: string, bookingId: string, userId: string, reason?: string): Promise<void>;
    getUpcomingBookings(tenantId: string, userId?: string, limit?: number): Promise<BookingWithDetails[]>;
    getBookingStatistics(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
        totalBookings: number;
        confirmedBookings: number;
        cancelledBookings: number;
        totalRevenue: number;
        averageBookingDuration: number;
        popularSpaces: Array<{
            spaceId: string;
            spaceName: string;
            bookingCount: number;
        }>;
        bookingsByStatus: Array<{
            status: BookingStatus;
            count: number;
        }>;
    }>;
    private validateBookingData;
    private formatBookingResponse;
}
export declare const bookingService: BookingService;
//# sourceMappingURL=bookingService.d.ts.map