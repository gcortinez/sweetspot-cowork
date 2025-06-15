import { SpaceType } from '@prisma/client';
export interface CreateSpaceData {
    name: string;
    type: SpaceType;
    description?: string;
    capacity: number;
    amenities?: string[];
    hourlyRate?: number;
    isActive?: boolean;
    location?: string;
    floor?: number;
    equipment?: string[];
    features?: string[];
}
export interface UpdateSpaceData {
    name?: string;
    type?: SpaceType;
    description?: string;
    capacity?: number;
    amenities?: string[];
    hourlyRate?: number;
    isActive?: boolean;
    location?: string;
    floor?: number;
    equipment?: string[];
    features?: string[];
}
export interface SpaceAvailabilityQuery {
    startTime: Date;
    endTime: Date;
    capacity?: number;
    type?: SpaceType;
    amenities?: string[];
}
export interface SpaceWithDetails {
    id: string;
    tenantId: string;
    name: string;
    type: SpaceType;
    description?: string;
    capacity: number;
    amenities: string[];
    hourlyRate?: number;
    isActive: boolean;
    location?: string;
    floor?: number;
    equipment?: string[];
    features?: string[];
    createdAt: Date;
    updatedAt: Date;
    bookings?: any[];
    occupancyTracking?: any[];
}
export declare class SpaceService {
    createSpace(tenantId: string, data: CreateSpaceData): Promise<SpaceWithDetails>;
    getSpaces(tenantId: string, filters?: {
        type?: SpaceType;
        isActive?: boolean;
        capacity?: number;
        amenities?: string[];
    }): Promise<SpaceWithDetails[]>;
    getSpaceById(tenantId: string, spaceId: string): Promise<SpaceWithDetails | null>;
    updateSpace(tenantId: string, spaceId: string, data: UpdateSpaceData): Promise<SpaceWithDetails>;
    deleteSpace(tenantId: string, spaceId: string): Promise<void>;
    checkSpaceAvailability(tenantId: string, spaceId: string, startTime: Date, endTime: Date): Promise<{
        isAvailable: boolean;
        conflictingBookings?: any[];
        space?: SpaceWithDetails;
    }>;
    findAvailableSpaces(tenantId: string, query: SpaceAvailabilityQuery): Promise<SpaceWithDetails[]>;
    getSpaceUtilization(tenantId: string, spaceId?: string, startDate?: Date, endDate?: Date): Promise<{
        totalBookings: number;
        totalHours: number;
        averageBookingDuration: number;
        utilizationRate: number;
        popularTimeSlots: any[];
        revenueGenerated: number;
    }>;
    private validateSpaceData;
    private formatSpaceResponse;
}
export declare const spaceService: SpaceService;
//# sourceMappingURL=spaceService.d.ts.map