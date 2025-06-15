"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityService = void 0;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
class ActivityService {
    async getActivities(tenantId, query) {
        const { page, limit, search, type, clientId, leadId, opportunityId, userId, completed, overdue, dateFrom, dateTo, sortBy, sortOrder } = query;
        const offset = (page - 1) * limit;
        const where = { tenantId };
        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { outcome: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (type)
            where.type = type;
        if (clientId)
            where.clientId = clientId;
        if (leadId)
            where.leadId = leadId;
        if (opportunityId)
            where.opportunityId = opportunityId;
        if (userId)
            where.userId = userId;
        if (completed !== undefined) {
            where.completedAt = completed ? { not: null } : null;
        }
        if (overdue === true) {
            where.AND = [
                { dueDate: { lt: new Date() } },
                { completedAt: null }
            ];
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        const [activities, total] = await Promise.all([
            prisma_1.prisma.activity.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    lead: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    opportunity: {
                        select: {
                            id: true,
                            title: true,
                            value: true,
                            stage: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: offset,
                take: limit,
            }),
            prisma_1.prisma.activity.count({ where }),
        ]);
        return {
            activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getActivityById(tenantId, activityId) {
        const activity = await prisma_1.prisma.activity.findFirst({
            where: { id: activityId, tenantId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        score: true,
                        status: true,
                    },
                },
                opportunity: {
                    select: {
                        id: true,
                        title: true,
                        value: true,
                        stage: true,
                        probability: true,
                    },
                },
            },
        });
        if (!activity) {
            throw new errors_1.NotFoundError('Activity not found');
        }
        return activity;
    }
    async createActivity(tenantId, userId, data) {
        if (data.clientId) {
            const client = await prisma_1.prisma.client.findFirst({
                where: { id: data.clientId, tenantId },
            });
            if (!client) {
                throw new errors_1.ValidationError('Client not found');
            }
        }
        if (data.leadId) {
            const lead = await prisma_1.prisma.lead.findFirst({
                where: { id: data.leadId, tenantId },
            });
            if (!lead) {
                throw new errors_1.ValidationError('Lead not found');
            }
        }
        if (data.opportunityId) {
            const opportunity = await prisma_1.prisma.opportunity.findFirst({
                where: { id: data.opportunityId, tenantId },
            });
            if (!opportunity) {
                throw new errors_1.ValidationError('Opportunity not found');
            }
        }
        const activity = await prisma_1.prisma.activity.create({
            data: {
                ...data,
                tenantId,
                userId,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
                metadata: data.metadata || {},
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                opportunity: {
                    select: {
                        id: true,
                        title: true,
                        value: true,
                        stage: true,
                    },
                },
            },
        });
        return activity;
    }
    async updateActivity(tenantId, activityId, data) {
        const existingActivity = await prisma_1.prisma.activity.findFirst({
            where: { id: activityId, tenantId },
        });
        if (!existingActivity) {
            throw new errors_1.NotFoundError('Activity not found');
        }
        if (data.clientId) {
            const client = await prisma_1.prisma.client.findFirst({
                where: { id: data.clientId, tenantId },
            });
            if (!client) {
                throw new errors_1.ValidationError('Client not found');
            }
        }
        if (data.leadId) {
            const lead = await prisma_1.prisma.lead.findFirst({
                where: { id: data.leadId, tenantId },
            });
            if (!lead) {
                throw new errors_1.ValidationError('Lead not found');
            }
        }
        if (data.opportunityId) {
            const opportunity = await prisma_1.prisma.opportunity.findFirst({
                where: { id: data.opportunityId, tenantId },
            });
            if (!opportunity) {
                throw new errors_1.ValidationError('Opportunity not found');
            }
        }
        const updateData = { ...data };
        if (data.dueDate) {
            updateData.dueDate = new Date(data.dueDate);
        }
        if (data.completedAt) {
            updateData.completedAt = new Date(data.completedAt);
        }
        const activity = await prisma_1.prisma.activity.update({
            where: { id: activityId },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                opportunity: {
                    select: {
                        id: true,
                        title: true,
                        value: true,
                        stage: true,
                    },
                },
            },
        });
        return activity;
    }
    async deleteActivity(tenantId, activityId) {
        const activity = await prisma_1.prisma.activity.findFirst({
            where: { id: activityId, tenantId },
        });
        if (!activity) {
            throw new errors_1.NotFoundError('Activity not found');
        }
        await prisma_1.prisma.activity.delete({
            where: { id: activityId },
        });
    }
    async completeActivity(tenantId, activityId, outcome) {
        const activity = await prisma_1.prisma.activity.findFirst({
            where: { id: activityId, tenantId },
        });
        if (!activity) {
            throw new errors_1.NotFoundError('Activity not found');
        }
        if (activity.completedAt) {
            throw new errors_1.ConflictError('Activity is already completed');
        }
        const updatedActivity = await prisma_1.prisma.activity.update({
            where: { id: activityId },
            data: {
                completedAt: new Date(),
                outcome: outcome || activity.outcome,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        return updatedActivity;
    }
    async bulkAction(tenantId, data) {
        const { activityIds, action, assignedToId, completedAt } = data;
        const activities = await prisma_1.prisma.activity.findMany({
            where: {
                id: { in: activityIds },
                tenantId,
            },
        });
        if (activities.length !== activityIds.length) {
            throw new errors_1.ValidationError('Some activities not found or access denied');
        }
        let result = {};
        switch (action) {
            case 'complete':
                result = await prisma_1.prisma.activity.updateMany({
                    where: {
                        id: { in: activityIds },
                        tenantId,
                    },
                    data: {
                        completedAt: completedAt ? new Date(completedAt) : new Date(),
                    },
                });
                break;
            case 'delete':
                result = await prisma_1.prisma.activity.deleteMany({
                    where: {
                        id: { in: activityIds },
                        tenantId,
                    },
                });
                break;
            case 'assign':
                if (!assignedToId) {
                    throw new errors_1.ValidationError('Assigned user ID is required for assign action');
                }
                const assignedUser = await prisma_1.prisma.user.findFirst({
                    where: { id: assignedToId, tenantId },
                });
                if (!assignedUser) {
                    throw new errors_1.ValidationError('Assigned user not found');
                }
                result = await prisma_1.prisma.activity.updateMany({
                    where: {
                        id: { in: activityIds },
                        tenantId,
                    },
                    data: {
                        userId: assignedToId,
                    },
                });
                break;
            default:
                throw new errors_1.ValidationError('Invalid bulk action');
        }
        return {
            action,
            affected: result.count || 0,
            activityIds,
        };
    }
    async getActivityStats(tenantId) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        const [totalCount, completedCount, overdueCount, typeStats, userStats, durationStats, upcomingCount,] = await Promise.all([
            prisma_1.prisma.activity.count({ where: { tenantId } }),
            prisma_1.prisma.activity.count({
                where: { tenantId, completedAt: { not: null } },
            }),
            prisma_1.prisma.activity.count({
                where: {
                    tenantId,
                    dueDate: { lt: now },
                    completedAt: null,
                },
            }),
            prisma_1.prisma.activity.groupBy({
                by: ['type'],
                where: { tenantId },
                _count: { type: true },
            }),
            prisma_1.prisma.activity.groupBy({
                by: ['userId'],
                where: { tenantId },
                _count: { userId: true },
            }),
            prisma_1.prisma.activity.aggregate({
                where: {
                    tenantId,
                    duration: { not: null },
                },
                _avg: { duration: true },
            }),
            prisma_1.prisma.activity.count({
                where: {
                    tenantId,
                    dueDate: {
                        gte: startOfWeek,
                        lt: endOfWeek,
                    },
                    completedAt: null,
                },
            }),
        ]);
        const byType = {};
        typeStats.forEach(({ type, _count }) => {
            byType[type] = _count.type;
        });
        const userIds = userStats.map(stat => stat.userId);
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
        });
        const byUser = await Promise.all(userStats.map(async ({ userId, _count }) => {
            const user = users.find(u => u.id === userId);
            const completed = await prisma_1.prisma.activity.count({
                where: {
                    tenantId,
                    userId,
                    completedAt: { not: null },
                },
            });
            return {
                userId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                total: _count.userId,
                completed,
                pending: _count.userId - completed,
            };
        }));
        const pendingCount = totalCount - completedCount;
        const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return {
            total: totalCount,
            completed: completedCount,
            pending: pendingCount,
            overdue: overdueCount,
            byType,
            byUser,
            completionRate,
            averageDuration: Number(durationStats._avg.duration || 0),
            upcomingThisWeek: upcomingCount,
        };
    }
    async getActivityTimeline(tenantId, query) {
        const { clientId, leadId, opportunityId, days } = query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const where = {
            tenantId,
            createdAt: { gte: startDate },
        };
        if (clientId)
            where.clientId = clientId;
        if (leadId)
            where.leadId = leadId;
        if (opportunityId)
            where.opportunityId = opportunityId;
        const activities = await prisma_1.prisma.activity.findMany({
            where,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                client: {
                    select: {
                        name: true,
                    },
                },
                lead: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                opportunity: {
                    select: {
                        title: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const timeline = activities.reduce((acc, activity) => {
            const date = activity.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(activity);
            return acc;
        }, {});
        return timeline;
    }
    async getUpcomingActivities(tenantId, userId, days = 7) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + days);
        const activities = await prisma_1.prisma.activity.findMany({
            where: {
                tenantId,
                userId,
                dueDate: {
                    gte: startDate,
                    lte: endDate,
                },
                completedAt: null,
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
                lead: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                opportunity: {
                    select: {
                        title: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        return activities;
    }
    async getOverdueActivities(tenantId, userId) {
        const now = new Date();
        const activities = await prisma_1.prisma.activity.findMany({
            where: {
                tenantId,
                userId,
                dueDate: { lt: now },
                completedAt: null,
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
                lead: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                opportunity: {
                    select: {
                        title: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
        return activities;
    }
    async getActivitiesByEntity(tenantId, entityType, entityId) {
        const where = { tenantId };
        switch (entityType) {
            case 'lead':
                where.leadId = entityId;
                break;
            case 'client':
                where.clientId = entityId;
                break;
            case 'opportunity':
                where.opportunityId = entityId;
                break;
        }
        const activities = await prisma_1.prisma.activity.findMany({
            where,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return activities;
    }
}
exports.activityService = new ActivityService();
//# sourceMappingURL=activityService.js.map