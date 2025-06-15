import { MaintenanceType, MaintenanceStatus, SpaceType } from '@prisma/client';
export interface RoomInventoryItem {
    id: string;
    name: string;
    type: SpaceType;
    capacity: number;
    isActive: boolean;
    currentStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_ORDER';
    utilizationRate: number;
    revenue: number;
    maintenanceDue: boolean;
    nextMaintenance?: Date;
    features: Array<{
        id: string;
        name: string;
        category: string;
        quantity: number;
        isWorking: boolean;
    }>;
}
export interface MaintenanceRequest {
    spaceId: string;
    maintenanceType: MaintenanceType;
    title: string;
    description?: string;
    scheduledAt: Date;
    performedBy?: string;
    estimatedCost?: number;
}
export interface UtilizationReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    overall: {
        totalRooms: number;
        activeRooms: number;
        averageUtilization: number;
        totalRevenue: number;
        occupancyHours: number;
    };
    byRoom: Array<{
        roomId: string;
        roomName: string;
        type: SpaceType;
        utilizationRate: number;
        bookingsCount: number;
        revenue: number;
        occupancyHours: number;
        peakUsageHours: string[];
    }>;
    trends: Array<{
        date: string;
        utilizationRate: number;
        bookingsCount: number;
        revenue: number;
    }>;
}
export interface MaintenanceSchedule {
    upcoming: Array<{
        id: string;
        spaceId: string;
        spaceName: string;
        type: MaintenanceType;
        title: string;
        scheduledAt: Date;
        status: MaintenanceStatus;
        estimatedDuration?: number;
    }>;
    overdue: Array<{
        id: string;
        spaceId: string;
        spaceName: string;
        type: MaintenanceType;
        title: string;
        scheduledAt: Date;
        daysPastDue: number;
    }>;
    recurring: Array<{
        spaceId: string;
        spaceName: string;
        maintenanceType: MaintenanceType;
        frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
        nextDue: Date;
    }>;
}
export declare class RoomInventoryService {
    getInventoryOverview(tenantId: string): Promise<{
        summary: {
            totalRooms: number;
            activeRooms: number;
            availableRooms: number;
            occupiedRooms: number;
            maintenanceRooms: number;
            outOfOrderRooms: number;
        };
        rooms: RoomInventoryItem[];
    }>;
    getUtilizationReport(tenantId: string, startDate: Date, endDate: Date, roomIds?: string[]): Promise<UtilizationReport>;
    scheduleMaintenanceTask(tenantId: string, request: MaintenanceRequest): Promise<{
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
        tenantId: string;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.MaintenanceStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        notes: string | null;
        spaceId: string;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        completedAt: Date | null;
        maintenanceType: import(".prisma/client").$Enums.MaintenanceType;
        scheduledAt: Date;
        performedBy: string | null;
    }>;
    updateMaintenanceStatus(tenantId: string, maintenanceId: string, status: MaintenanceStatus, notes?: string, actualCost?: number): Promise<{
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
        tenantId: string;
        id: string;
        title: string;
        status: import(".prisma/client").$Enums.MaintenanceStatus;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        notes: string | null;
        spaceId: string;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        completedAt: Date | null;
        maintenanceType: import(".prisma/client").$Enums.MaintenanceType;
        scheduledAt: Date;
        performedBy: string | null;
    }>;
    getMaintenanceSchedule(tenantId: string): Promise<MaintenanceSchedule>;
    getOptimizationRecommendations(tenantId: string): Promise<{
        utilizationOptimization: Array<{
            roomId: string;
            roomName: string;
            issue: string;
            recommendation: string;
            priority: 'HIGH' | 'MEDIUM' | 'LOW';
            potentialImpact: string;
        }>;
        maintenanceOptimization: Array<{
            roomId: string;
            roomName: string;
            issue: string;
            recommendation: string;
            priority: 'HIGH' | 'MEDIUM' | 'LOW';
            estimatedCost?: number;
        }>;
        revenueOptimization: Array<{
            roomId: string;
            roomName: string;
            currentRevenue: number;
            potentialRevenue: number;
            recommendation: string;
            strategy: string;
        }>;
    }>;
    private isMaintenanceDue;
    private getNextMaintenanceDate;
    exportInventoryReport(tenantId: string, format?: 'CSV' | 'JSON'): Promise<{
        format: string;
        data: (string | number)[][];
    } | {
        format: string;
        data: {
            summary: {
                totalRooms: number;
                activeRooms: number;
                availableRooms: number;
                occupiedRooms: number;
                maintenanceRooms: number;
                outOfOrderRooms: number;
            };
            rooms: RoomInventoryItem[];
        };
    }>;
}
export declare const roomInventoryService: RoomInventoryService;
//# sourceMappingURL=roomInventoryService.d.ts.map