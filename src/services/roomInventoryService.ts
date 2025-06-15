import { prisma } from '../lib/prisma';
import {
  MaintenanceType,
  MaintenanceStatus,
  RecurrenceType,
  SpaceType
} from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

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

// ============================================================================
// ROOM INVENTORY SERVICE
// ============================================================================

export class RoomInventoryService {

  // ============================================================================
  // INVENTORY OVERVIEW
  // ============================================================================

  async getInventoryOverview(tenantId: string): Promise<{
    summary: {
      totalRooms: number;
      activeRooms: number;
      availableRooms: number;
      occupiedRooms: number;
      maintenanceRooms: number;
      outOfOrderRooms: number;
    };
    rooms: RoomInventoryItem[];
  }> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all rooms with their current status
      const rooms = await prisma.space.findMany({
        where: { tenantId },
        include: {
          features: {
            include: {
              feature: true,
            },
          },
          bookings: {
            where: {
              startTime: { lte: now },
              endTime: { gt: now },
              status: { in: ['CONFIRMED', 'CHECKED_IN'] },
            },
          },
          maintenanceLogs: {
            where: {
              status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
              scheduledAt: { lte: now },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 1,
          },
          usageAnalytics: {
            where: {
              date: { gte: thirtyDaysAgo },
            },
          },
        },
      });

      const inventoryItems: RoomInventoryItem[] = [];
      const summary = {
        totalRooms: rooms.length,
        activeRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        outOfOrderRooms: 0,
      };

      for (const room of rooms) {
        // Determine current status
        let currentStatus: RoomInventoryItem['currentStatus'] = 'AVAILABLE';
        
        if (!room.isActive) {
          currentStatus = 'OUT_OF_ORDER';
          summary.outOfOrderRooms++;
        } else if (room.maintenanceLogs.length > 0) {
          currentStatus = 'MAINTENANCE';
          summary.maintenanceRooms++;
        } else if (room.bookings.length > 0) {
          currentStatus = 'OCCUPIED';
          summary.occupiedRooms++;
        } else {
          summary.availableRooms++;
        }

        if (room.isActive) {
          summary.activeRooms++;
        }

        // Calculate utilization rate
        const utilizationData = room.usageAnalytics;
        const avgUtilization = utilizationData.length > 0
          ? utilizationData.reduce((sum, day) => sum + Number(day.utilizationRate), 0) / utilizationData.length
          : 0;

        // Calculate revenue
        const totalRevenue = utilizationData.reduce((sum, day) => sum + Number(day.revenue), 0);

        // Check if maintenance is due
        const maintenanceDue = await this.isMaintenanceDue(room.id);
        const nextMaintenance = await this.getNextMaintenanceDate(room.id);

        inventoryItems.push({
          id: room.id,
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          isActive: room.isActive,
          currentStatus,
          utilizationRate: avgUtilization,
          revenue: totalRevenue,
          maintenanceDue,
          nextMaintenance,
          features: room.features.map(spaceFeature => ({
            id: spaceFeature.feature.id,
            name: spaceFeature.feature.name,
            category: spaceFeature.feature.category,
            quantity: spaceFeature.quantity,
            isWorking: spaceFeature.isWorking,
          })),
        });
      }

      return {
        summary,
        rooms: inventoryItems,
      };
    } catch (error) {
      logger.error('Failed to get inventory overview', { tenantId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // UTILIZATION REPORTING
  // ============================================================================

  async getUtilizationReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    roomIds?: string[]
  ): Promise<UtilizationReport> {
    try {
      const whereClause: any = {
        tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (roomIds && roomIds.length > 0) {
        whereClause.spaceId = { in: roomIds };
      }

      // Get usage analytics for the period
      const analytics = await prisma.roomUsageAnalytics.findMany({
        where: whereClause,
        include: {
          space: true,
        },
        orderBy: [{ spaceId: 'asc' }, { date: 'asc' }],
      });

      // Group analytics by room
      const roomAnalytics = new Map<string, any[]>();
      analytics.forEach(record => {
        const roomId = record.spaceId;
        if (!roomAnalytics.has(roomId)) {
          roomAnalytics.set(roomId, []);
        }
        roomAnalytics.get(roomId)!.push(record);
      });

      // Calculate overall metrics
      const totalRooms = roomAnalytics.size;
      const totalRevenue = analytics.reduce((sum, record) => sum + Number(record.revenue), 0);
      const totalOccupancyHours = analytics.reduce((sum, record) => sum + Number(record.totalHours), 0);
      const averageUtilization = analytics.length > 0
        ? analytics.reduce((sum, record) => sum + Number(record.utilizationRate), 0) / analytics.length
        : 0;

      // Calculate by-room metrics
      const byRoom = Array.from(roomAnalytics.entries()).map(([roomId, records]) => {
        const roomName = records[0].space.name;
        const roomType = records[0].space.type;
        
        const utilizationRate = records.reduce((sum, r) => sum + Number(r.utilizationRate), 0) / records.length;
        const bookingsCount = records.reduce((sum, r) => sum + r.totalBookings, 0);
        const revenue = records.reduce((sum, r) => sum + Number(r.revenue), 0);
        const occupancyHours = records.reduce((sum, r) => sum + Number(r.totalHours), 0);
        
        // Determine peak usage hours
        const peakUsageHours = records
          .filter(r => r.peakHourStart && r.peakHourEnd)
          .map(r => `${r.peakHourStart}-${r.peakHourEnd}`)
          .filter((value, index, self) => self.indexOf(value) === index);

        return {
          roomId,
          roomName,
          type: roomType,
          utilizationRate,
          bookingsCount,
          revenue,
          occupancyHours,
          peakUsageHours,
        };
      });

      // Calculate daily trends
      const dailyTrends = new Map<string, any>();
      analytics.forEach(record => {
        const dateKey = record.date.toISOString().split('T')[0];
        if (!dailyTrends.has(dateKey)) {
          dailyTrends.set(dateKey, {
            date: dateKey,
            utilizationRate: 0,
            bookingsCount: 0,
            revenue: 0,
            recordCount: 0,
          });
        }
        
        const trend = dailyTrends.get(dateKey)!;
        trend.utilizationRate += Number(record.utilizationRate);
        trend.bookingsCount += record.totalBookings;
        trend.revenue += Number(record.revenue);
        trend.recordCount++;
      });

      const trends = Array.from(dailyTrends.values()).map(trend => ({
        date: trend.date,
        utilizationRate: trend.recordCount > 0 ? trend.utilizationRate / trend.recordCount : 0,
        bookingsCount: trend.bookingsCount,
        revenue: trend.revenue,
      }));

      return {
        period: { startDate, endDate },
        overall: {
          totalRooms,
          activeRooms: totalRooms, // Assuming all rooms in analytics are active
          averageUtilization,
          totalRevenue,
          occupancyHours: totalOccupancyHours,
        },
        byRoom,
        trends,
      };
    } catch (error) {
      logger.error('Failed to get utilization report', { tenantId, startDate, endDate }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // MAINTENANCE MANAGEMENT
  // ============================================================================

  async scheduleMaintenanceTask(tenantId: string, request: MaintenanceRequest) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Verify the space exists and belongs to tenant
        const space = await tx.space.findFirst({
          where: { id: request.spaceId, tenantId },
        });

        if (!space) {
          throw new Error('Space not found');
        }

        // Check for conflicting maintenance
        const existingMaintenance = await tx.roomMaintenanceLog.findFirst({
          where: {
            spaceId: request.spaceId,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
            scheduledAt: {
              gte: new Date(request.scheduledAt.getTime() - 4 * 60 * 60 * 1000), // 4 hours before
              lte: new Date(request.scheduledAt.getTime() + 4 * 60 * 60 * 1000), // 4 hours after
            },
          },
        });

        if (existingMaintenance) {
          throw new Error('Conflicting maintenance task already scheduled');
        }

        // Create maintenance task
        const maintenanceTask = await tx.roomMaintenanceLog.create({
          data: {
            tenantId,
            spaceId: request.spaceId,
            maintenanceType: request.maintenanceType,
            title: request.title,
            description: request.description,
            scheduledAt: request.scheduledAt,
            performedBy: request.performedBy,
            cost: request.estimatedCost,
            status: MaintenanceStatus.SCHEDULED,
          },
          include: {
            space: true,
          },
        });

        // Cancel any bookings during maintenance if it's an emergency or repair
        if (request.maintenanceType === MaintenanceType.EMERGENCY || 
            request.maintenanceType === MaintenanceType.REPAIR) {
          
          const maintenanceEnd = new Date(request.scheduledAt.getTime() + 4 * 60 * 60 * 1000); // Assume 4 hours
          
          await tx.booking.updateMany({
            where: {
              spaceId: request.spaceId,
              status: { in: ['CONFIRMED', 'PENDING'] },
              startTime: { gte: request.scheduledAt },
              endTime: { lte: maintenanceEnd },
            },
            data: {
              status: 'CANCELLED',
            },
          });
        }

        return maintenanceTask;
      });
    } catch (error) {
      logger.error('Failed to schedule maintenance task', { tenantId, request }, error as Error);
      throw error;
    }
  }

  async updateMaintenanceStatus(
    tenantId: string,
    maintenanceId: string,
    status: MaintenanceStatus,
    notes?: string,
    actualCost?: number
  ) {
    try {
      const updateData: any = {
        status,
        notes,
      };

      if (status === MaintenanceStatus.COMPLETED) {
        updateData.completedAt = new Date();
        if (actualCost !== undefined) {
          updateData.cost = actualCost;
        }
      }

      return await prisma.roomMaintenanceLog.update({
        where: {
          id: maintenanceId,
          tenantId,
        },
        data: updateData,
        include: {
          space: true,
        },
      });
    } catch (error) {
      logger.error('Failed to update maintenance status', { tenantId, maintenanceId, status }, error as Error);
      throw error;
    }
  }

  async getMaintenanceSchedule(tenantId: string): Promise<MaintenanceSchedule> {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Get upcoming maintenance
      const upcoming = await prisma.roomMaintenanceLog.findMany({
        where: {
          tenantId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          scheduledAt: { gte: now, lte: thirtyDaysFromNow },
        },
        include: {
          space: true,
        },
        orderBy: { scheduledAt: 'asc' },
      });

      // Get overdue maintenance
      const overdue = await prisma.roomMaintenanceLog.findMany({
        where: {
          tenantId,
          status: 'SCHEDULED',
          scheduledAt: { lt: now },
        },
        include: {
          space: true,
        },
        orderBy: { scheduledAt: 'asc' },
      });

      const upcomingFormatted = upcoming.map(task => ({
        id: task.id,
        spaceId: task.spaceId,
        spaceName: task.space.name,
        type: task.maintenanceType,
        title: task.title,
        scheduledAt: task.scheduledAt,
        status: task.status,
        estimatedDuration: 240, // Default 4 hours, could be configurable
      }));

      const overdueFormatted = overdue.map(task => ({
        id: task.id,
        spaceId: task.spaceId,
        spaceName: task.space.name,
        type: task.maintenanceType,
        title: task.title,
        scheduledAt: task.scheduledAt,
        daysPastDue: Math.ceil((now.getTime() - task.scheduledAt.getTime()) / (24 * 60 * 60 * 1000)),
      }));

      // Calculate recurring maintenance (simplified - in production this would be more sophisticated)
      const spaces = await prisma.space.findMany({
        where: { tenantId, isActive: true },
      });

      const recurring = spaces.map(space => {
        // Simplified logic: cleaning weekly, inspection monthly, preventive quarterly
        const maintenanceTypes = [
          { type: MaintenanceType.CLEANING, frequency: 'WEEKLY' as const, days: 7 },
          { type: MaintenanceType.INSPECTION, frequency: 'MONTHLY' as const, days: 30 },
          { type: MaintenanceType.PREVENTIVE, frequency: 'QUARTERLY' as const, days: 90 },
        ];

        return maintenanceTypes.map(mt => {
          const nextDue = new Date(now.getTime() + mt.days * 24 * 60 * 60 * 1000);
          return {
            spaceId: space.id,
            spaceName: space.name,
            maintenanceType: mt.type,
            frequency: mt.frequency,
            nextDue,
          };
        });
      }).flat();

      return {
        upcoming: upcomingFormatted,
        overdue: overdueFormatted,
        recurring,
      };
    } catch (error) {
      logger.error('Failed to get maintenance schedule', { tenantId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  async getOptimizationRecommendations(tenantId: string): Promise<{
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
  }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const rooms = await prisma.space.findMany({
        where: { tenantId, isActive: true },
        include: {
          usageAnalytics: {
            where: { date: { gte: thirtyDaysAgo } },
          },
          maintenanceLogs: {
            where: { 
              scheduledAt: { gte: thirtyDaysAgo },
              status: { in: ['COMPLETED', 'CANCELLED'] },
            },
          },
        },
      });

      const utilizationOptimization: any[] = [];
      const maintenanceOptimization: any[] = [];
      const revenueOptimization: any[] = [];

      for (const room of rooms) {
        const analytics = room.usageAnalytics;
        
        if (analytics.length === 0) continue;

        const avgUtilization = analytics.reduce((sum, a) => sum + Number(a.utilizationRate), 0) / analytics.length;
        const avgRevenue = analytics.reduce((sum, a) => sum + Number(a.revenue), 0) / analytics.length;
        const totalBookings = analytics.reduce((sum, a) => sum + a.totalBookings, 0);

        // Utilization optimization
        if (avgUtilization < 0.3) {
          utilizationOptimization.push({
            roomId: room.id,
            roomName: room.name,
            issue: `Low utilization rate: ${Math.round(avgUtilization * 100)}%`,
            recommendation: 'Consider reducing price, improving marketing, or repurposing the space',
            priority: 'HIGH' as const,
            potentialImpact: 'Could increase bookings by 50-100%',
          });
        } else if (avgUtilization > 0.9) {
          utilizationOptimization.push({
            roomId: room.id,
            roomName: room.name,
            issue: `Very high utilization: ${Math.round(avgUtilization * 100)}%`,
            recommendation: 'Consider increasing price or adding similar rooms',
            priority: 'MEDIUM' as const,
            potentialImpact: 'Could increase revenue by 20-30%',
          });
        }

        // Maintenance optimization
        const maintenanceCount = room.maintenanceLogs.length;
        if (maintenanceCount > 4) { // More than 4 maintenance tasks in 30 days
          maintenanceOptimization.push({
            roomId: room.id,
            roomName: room.name,
            issue: `High maintenance frequency: ${maintenanceCount} tasks in 30 days`,
            recommendation: 'Consider equipment upgrade or more frequent preventive maintenance',
            priority: 'HIGH' as const,
            estimatedCost: 5000,
          });
        }

        // Revenue optimization
        const similarRooms = rooms.filter(r => r.type === room.type && r.id !== room.id);
        if (similarRooms.length > 0) {
          const similarAvgRevenue = similarRooms.reduce((sum, r) => {
            const rAnalytics = r.usageAnalytics;
            return sum + (rAnalytics.length > 0 ? 
              rAnalytics.reduce((s, a) => s + Number(a.revenue), 0) / rAnalytics.length : 0);
          }, 0) / similarRooms.length;

          if (avgRevenue < similarAvgRevenue * 0.8) {
            revenueOptimization.push({
              roomId: room.id,
              roomName: room.name,
              currentRevenue: avgRevenue,
              potentialRevenue: similarAvgRevenue,
              recommendation: 'Optimize pricing strategy or improve room features',
              strategy: 'Dynamic pricing based on demand',
            });
          }
        }
      }

      return {
        utilizationOptimization,
        maintenanceOptimization,
        revenueOptimization,
      };
    } catch (error) {
      logger.error('Failed to get optimization recommendations', { tenantId }, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async isMaintenanceDue(spaceId: string): Promise<boolean> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const dueMaintenance = await prisma.roomMaintenanceLog.findFirst({
      where: {
        spaceId,
        status: 'SCHEDULED',
        scheduledAt: { lte: sevenDaysFromNow },
      },
    });

    return !!dueMaintenance;
  }

  private async getNextMaintenanceDate(spaceId: string): Promise<Date | undefined> {
    const nextMaintenance = await prisma.roomMaintenanceLog.findFirst({
      where: {
        spaceId,
        status: 'SCHEDULED',
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return nextMaintenance?.scheduledAt;
  }

  async exportInventoryReport(tenantId: string, format: 'CSV' | 'JSON' = 'JSON') {
    try {
      const inventory = await this.getInventoryOverview(tenantId);
      
      if (format === 'CSV') {
        // Convert to CSV format (simplified)
        const headers = ['Room Name', 'Type', 'Capacity', 'Status', 'Utilization %', 'Revenue', 'Maintenance Due'];
        const rows = inventory.rooms.map(room => [
          room.name,
          room.type,
          room.capacity,
          room.currentStatus,
          Math.round(room.utilizationRate * 100),
          room.revenue,
          room.maintenanceDue ? 'Yes' : 'No',
        ]);
        
        return {
          format: 'CSV',
          data: [headers, ...rows],
        };
      }

      return {
        format: 'JSON',
        data: inventory,
      };
    } catch (error) {
      logger.error('Failed to export inventory report', { tenantId, format }, error as Error);
      throw error;
    }
  }
}

export const roomInventoryService = new RoomInventoryService();