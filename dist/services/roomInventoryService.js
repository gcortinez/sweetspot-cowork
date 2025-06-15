"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomInventoryService = exports.RoomInventoryService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class RoomInventoryService {
    async getInventoryOverview(tenantId) {
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const rooms = await prisma_1.prisma.space.findMany({
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
            const inventoryItems = [];
            const summary = {
                totalRooms: rooms.length,
                activeRooms: 0,
                availableRooms: 0,
                occupiedRooms: 0,
                maintenanceRooms: 0,
                outOfOrderRooms: 0,
            };
            for (const room of rooms) {
                let currentStatus = 'AVAILABLE';
                if (!room.isActive) {
                    currentStatus = 'OUT_OF_ORDER';
                    summary.outOfOrderRooms++;
                }
                else if (room.maintenanceLogs.length > 0) {
                    currentStatus = 'MAINTENANCE';
                    summary.maintenanceRooms++;
                }
                else if (room.bookings.length > 0) {
                    currentStatus = 'OCCUPIED';
                    summary.occupiedRooms++;
                }
                else {
                    summary.availableRooms++;
                }
                if (room.isActive) {
                    summary.activeRooms++;
                }
                const utilizationData = room.usageAnalytics;
                const avgUtilization = utilizationData.length > 0
                    ? utilizationData.reduce((sum, day) => sum + Number(day.utilizationRate), 0) / utilizationData.length
                    : 0;
                const totalRevenue = utilizationData.reduce((sum, day) => sum + Number(day.revenue), 0);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get inventory overview', { tenantId }, error);
            throw error;
        }
    }
    async getUtilizationReport(tenantId, startDate, endDate, roomIds) {
        try {
            const whereClause = {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            if (roomIds && roomIds.length > 0) {
                whereClause.spaceId = { in: roomIds };
            }
            const analytics = await prisma_1.prisma.roomUsageAnalytics.findMany({
                where: whereClause,
                include: {
                    space: true,
                },
                orderBy: [{ spaceId: 'asc' }, { date: 'asc' }],
            });
            const roomAnalytics = new Map();
            analytics.forEach(record => {
                const roomId = record.spaceId;
                if (!roomAnalytics.has(roomId)) {
                    roomAnalytics.set(roomId, []);
                }
                roomAnalytics.get(roomId).push(record);
            });
            const totalRooms = roomAnalytics.size;
            const totalRevenue = analytics.reduce((sum, record) => sum + Number(record.revenue), 0);
            const totalOccupancyHours = analytics.reduce((sum, record) => sum + Number(record.totalHours), 0);
            const averageUtilization = analytics.length > 0
                ? analytics.reduce((sum, record) => sum + Number(record.utilizationRate), 0) / analytics.length
                : 0;
            const byRoom = Array.from(roomAnalytics.entries()).map(([roomId, records]) => {
                const roomName = records[0].space.name;
                const roomType = records[0].space.type;
                const utilizationRate = records.reduce((sum, r) => sum + Number(r.utilizationRate), 0) / records.length;
                const bookingsCount = records.reduce((sum, r) => sum + r.totalBookings, 0);
                const revenue = records.reduce((sum, r) => sum + Number(r.revenue), 0);
                const occupancyHours = records.reduce((sum, r) => sum + Number(r.totalHours), 0);
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
            const dailyTrends = new Map();
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
                const trend = dailyTrends.get(dateKey);
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
                    activeRooms: totalRooms,
                    averageUtilization,
                    totalRevenue,
                    occupancyHours: totalOccupancyHours,
                },
                byRoom,
                trends,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get utilization report', { tenantId, startDate, endDate }, error);
            throw error;
        }
    }
    async scheduleMaintenanceTask(tenantId, request) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const space = await tx.space.findFirst({
                    where: { id: request.spaceId, tenantId },
                });
                if (!space) {
                    throw new Error('Space not found');
                }
                const existingMaintenance = await tx.roomMaintenanceLog.findFirst({
                    where: {
                        spaceId: request.spaceId,
                        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                        scheduledAt: {
                            gte: new Date(request.scheduledAt.getTime() - 4 * 60 * 60 * 1000),
                            lte: new Date(request.scheduledAt.getTime() + 4 * 60 * 60 * 1000),
                        },
                    },
                });
                if (existingMaintenance) {
                    throw new Error('Conflicting maintenance task already scheduled');
                }
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
                        status: client_1.MaintenanceStatus.SCHEDULED,
                    },
                    include: {
                        space: true,
                    },
                });
                if (request.maintenanceType === client_1.MaintenanceType.EMERGENCY ||
                    request.maintenanceType === client_1.MaintenanceType.REPAIR) {
                    const maintenanceEnd = new Date(request.scheduledAt.getTime() + 4 * 60 * 60 * 1000);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to schedule maintenance task', { tenantId, request }, error);
            throw error;
        }
    }
    async updateMaintenanceStatus(tenantId, maintenanceId, status, notes, actualCost) {
        try {
            const updateData = {
                status,
                notes,
            };
            if (status === client_1.MaintenanceStatus.COMPLETED) {
                updateData.completedAt = new Date();
                if (actualCost !== undefined) {
                    updateData.cost = actualCost;
                }
            }
            return await prisma_1.prisma.roomMaintenanceLog.update({
                where: {
                    id: maintenanceId,
                    tenantId,
                },
                data: updateData,
                include: {
                    space: true,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update maintenance status', { tenantId, maintenanceId, status }, error);
            throw error;
        }
    }
    async getMaintenanceSchedule(tenantId) {
        try {
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const upcoming = await prisma_1.prisma.roomMaintenanceLog.findMany({
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
            const overdue = await prisma_1.prisma.roomMaintenanceLog.findMany({
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
                estimatedDuration: 240,
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
            const spaces = await prisma_1.prisma.space.findMany({
                where: { tenantId, isActive: true },
            });
            const recurring = spaces.map(space => {
                const maintenanceTypes = [
                    { type: client_1.MaintenanceType.CLEANING, frequency: 'WEEKLY', days: 7 },
                    { type: client_1.MaintenanceType.INSPECTION, frequency: 'MONTHLY', days: 30 },
                    { type: client_1.MaintenanceType.PREVENTIVE, frequency: 'QUARTERLY', days: 90 },
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get maintenance schedule', { tenantId }, error);
            throw error;
        }
    }
    async getOptimizationRecommendations(tenantId) {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const rooms = await prisma_1.prisma.space.findMany({
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
            const utilizationOptimization = [];
            const maintenanceOptimization = [];
            const revenueOptimization = [];
            for (const room of rooms) {
                const analytics = room.usageAnalytics;
                if (analytics.length === 0)
                    continue;
                const avgUtilization = analytics.reduce((sum, a) => sum + Number(a.utilizationRate), 0) / analytics.length;
                const avgRevenue = analytics.reduce((sum, a) => sum + Number(a.revenue), 0) / analytics.length;
                const totalBookings = analytics.reduce((sum, a) => sum + a.totalBookings, 0);
                if (avgUtilization < 0.3) {
                    utilizationOptimization.push({
                        roomId: room.id,
                        roomName: room.name,
                        issue: `Low utilization rate: ${Math.round(avgUtilization * 100)}%`,
                        recommendation: 'Consider reducing price, improving marketing, or repurposing the space',
                        priority: 'HIGH',
                        potentialImpact: 'Could increase bookings by 50-100%',
                    });
                }
                else if (avgUtilization > 0.9) {
                    utilizationOptimization.push({
                        roomId: room.id,
                        roomName: room.name,
                        issue: `Very high utilization: ${Math.round(avgUtilization * 100)}%`,
                        recommendation: 'Consider increasing price or adding similar rooms',
                        priority: 'MEDIUM',
                        potentialImpact: 'Could increase revenue by 20-30%',
                    });
                }
                const maintenanceCount = room.maintenanceLogs.length;
                if (maintenanceCount > 4) {
                    maintenanceOptimization.push({
                        roomId: room.id,
                        roomName: room.name,
                        issue: `High maintenance frequency: ${maintenanceCount} tasks in 30 days`,
                        recommendation: 'Consider equipment upgrade or more frequent preventive maintenance',
                        priority: 'HIGH',
                        estimatedCost: 5000,
                    });
                }
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get optimization recommendations', { tenantId }, error);
            throw error;
        }
    }
    async isMaintenanceDue(spaceId) {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const dueMaintenance = await prisma_1.prisma.roomMaintenanceLog.findFirst({
            where: {
                spaceId,
                status: 'SCHEDULED',
                scheduledAt: { lte: sevenDaysFromNow },
            },
        });
        return !!dueMaintenance;
    }
    async getNextMaintenanceDate(spaceId) {
        const nextMaintenance = await prisma_1.prisma.roomMaintenanceLog.findFirst({
            where: {
                spaceId,
                status: 'SCHEDULED',
            },
            orderBy: { scheduledAt: 'asc' },
        });
        return nextMaintenance?.scheduledAt;
    }
    async exportInventoryReport(tenantId, format = 'JSON') {
        try {
            const inventory = await this.getInventoryOverview(tenantId);
            if (format === 'CSV') {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to export inventory report', { tenantId, format }, error);
            throw error;
        }
    }
}
exports.RoomInventoryService = RoomInventoryService;
exports.roomInventoryService = new RoomInventoryService();
//# sourceMappingURL=roomInventoryService.js.map