"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = void 0;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
class TaskService {
    async createTask(tenantId, createdById, data) {
        if (data.assignedToId) {
            const assignedUser = await prisma_1.prisma.user.findFirst({
                where: { id: data.assignedToId, tenantId },
            });
            if (!assignedUser) {
                throw new errors_1.NotFoundError('Assigned user not found');
            }
        }
        if (data.leadId) {
            const lead = await prisma_1.prisma.lead.findFirst({
                where: { id: data.leadId, tenantId },
            });
            if (!lead) {
                throw new errors_1.NotFoundError('Lead not found');
            }
        }
        if (data.clientId) {
            const client = await prisma_1.prisma.client.findFirst({
                where: { id: data.clientId, tenantId },
            });
            if (!client) {
                throw new errors_1.NotFoundError('Client not found');
            }
        }
        if (data.opportunityId) {
            const opportunity = await prisma_1.prisma.opportunity.findFirst({
                where: { id: data.opportunityId, tenantId },
            });
            if (!opportunity) {
                throw new errors_1.NotFoundError('Opportunity not found');
            }
        }
        const task = await prisma_1.prisma.task.create({
            data: {
                ...data,
                tenantId,
                createdById,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                reminderDate: data.reminderDate ? new Date(data.reminderDate) : undefined,
                tags: data.tags || [],
                metadata: data.metadata || {},
                status: 'PENDING',
            },
            include: {
                assignedTo: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                lead: {
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
                opportunity: {
                    select: {
                        title: true,
                    },
                },
                activity: {
                    select: {
                        subject: true,
                    },
                },
            },
        });
        return task;
    }
    async getTasks(tenantId, query) {
        const { page, limit, status, priority, assignedToId, entityType, entityId, dueDateFrom, dueDateTo, overdue, searchTerm, tags, sortBy, sortOrder, } = query;
        const offset = (page - 1) * limit;
        const where = { tenantId };
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (assignedToId)
            where.assignedToId = assignedToId;
        if (entityType && entityId) {
            switch (entityType) {
                case 'LEAD':
                    where.leadId = entityId;
                    break;
                case 'CLIENT':
                    where.clientId = entityId;
                    break;
                case 'OPPORTUNITY':
                    where.opportunityId = entityId;
                    break;
                case 'ACTIVITY':
                    where.activityId = entityId;
                    break;
            }
        }
        if (dueDateFrom || dueDateTo) {
            where.dueDate = {};
            if (dueDateFrom)
                where.dueDate.gte = new Date(dueDateFrom);
            if (dueDateTo)
                where.dueDate.lte = new Date(dueDateTo);
        }
        if (overdue) {
            where.dueDate = { lt: new Date() };
            where.status = { not: 'COMPLETED' };
        }
        if (searchTerm) {
            where.OR = [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
            ];
        }
        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags };
        }
        const [tasks, total] = await Promise.all([
            prisma_1.prisma.task.findMany({
                where,
                include: {
                    assignedTo: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    createdBy: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                    lead: {
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
                    opportunity: {
                        select: {
                            title: true,
                        },
                    },
                    activity: {
                        select: {
                            subject: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: offset,
                take: limit,
            }),
            prisma_1.prisma.task.count({ where }),
        ]);
        return {
            tasks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getTaskById(tenantId, taskId) {
        const task = await prisma_1.prisma.task.findFirst({
            where: { id: taskId, tenantId },
            include: {
                assignedTo: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
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
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                opportunity: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                activity: {
                    select: {
                        id: true,
                        subject: true,
                    },
                },
            },
        });
        if (!task) {
            throw new errors_1.NotFoundError('Task not found');
        }
        return task;
    }
    async updateTask(tenantId, taskId, data) {
        const existingTask = await prisma_1.prisma.task.findFirst({
            where: { id: taskId, tenantId },
        });
        if (!existingTask) {
            throw new errors_1.NotFoundError('Task not found');
        }
        if (data.assignedToId && data.assignedToId !== existingTask.assignedToId) {
            const assignedUser = await prisma_1.prisma.user.findFirst({
                where: { id: data.assignedToId, tenantId },
            });
            if (!assignedUser) {
                throw new errors_1.NotFoundError('Assigned user not found');
            }
        }
        if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
            data.completedAt = new Date().toISOString();
        }
        else if (data.status !== 'COMPLETED') {
            data.completedAt = undefined;
        }
        const task = await prisma_1.prisma.task.update({
            where: { id: taskId },
            data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                reminderDate: data.reminderDate ? new Date(data.reminderDate) : undefined,
                completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
                tags: data.tags || existingTask.tags,
                metadata: data.metadata || existingTask.metadata,
            },
            include: {
                assignedTo: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return task;
    }
    async deleteTask(tenantId, taskId) {
        const task = await prisma_1.prisma.task.findFirst({
            where: { id: taskId, tenantId },
        });
        if (!task) {
            throw new errors_1.NotFoundError('Task not found');
        }
        await prisma_1.prisma.task.delete({
            where: { id: taskId },
        });
        return { success: true };
    }
    async completeTask(tenantId, taskId, completedById, actualHours) {
        const task = await prisma_1.prisma.task.findFirst({
            where: { id: taskId, tenantId },
        });
        if (!task) {
            throw new errors_1.NotFoundError('Task not found');
        }
        if (task.status === 'COMPLETED') {
            throw new errors_1.ValidationError('Task is already completed');
        }
        const updatedTask = await prisma_1.prisma.task.update({
            where: { id: taskId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                actualHours,
            },
            include: {
                assignedTo: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return updatedTask;
    }
    async getTaskStats(tenantId) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const [totalTasks, statusStats, priorityStats, overdueTasks, dueTodayTasks, dueThisWeekTasks, completedTasks, userStats, recentTasks,] = await Promise.all([
            prisma_1.prisma.task.count({ where: { tenantId } }),
            prisma_1.prisma.task.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: { status: true },
            }),
            prisma_1.prisma.task.groupBy({
                by: ['priority'],
                where: { tenantId },
                _count: { priority: true },
            }),
            prisma_1.prisma.task.count({
                where: {
                    tenantId,
                    dueDate: { lt: now },
                    status: { not: 'COMPLETED' },
                },
            }),
            prisma_1.prisma.task.count({
                where: {
                    tenantId,
                    dueDate: {
                        gte: startOfDay,
                        lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
                    },
                    status: { not: 'COMPLETED' },
                },
            }),
            prisma_1.prisma.task.count({
                where: {
                    tenantId,
                    dueDate: {
                        gte: startOfWeek,
                        lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
                    },
                    status: { not: 'COMPLETED' },
                },
            }),
            prisma_1.prisma.task.count({
                where: { tenantId, status: 'COMPLETED' },
            }),
            prisma_1.prisma.task.groupBy({
                by: ['assignedToId'],
                where: { tenantId, assignedToId: { not: null } },
                _count: { assignedToId: true },
            }),
            prisma_1.prisma.task.findMany({
                where: { tenantId },
                include: {
                    assignedTo: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        const byStatus = statusStats.map(({ status, _count }) => ({
            status,
            count: _count.status,
            percentage: totalTasks > 0 ? (_count.status / totalTasks) * 100 : 0,
        }));
        const byPriority = priorityStats.map(({ priority, _count }) => ({
            priority,
            count: _count.priority,
            percentage: totalTasks > 0 ? (_count.priority / totalTasks) * 100 : 0,
        }));
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const completedTasksWithDates = await prisma_1.prisma.task.findMany({
            where: {
                tenantId,
                status: 'COMPLETED',
                completedAt: { not: null },
            },
            select: {
                createdAt: true,
                completedAt: true,
            },
        });
        const averageCompletionTime = completedTasksWithDates.length > 0
            ? completedTasksWithDates.reduce((sum, task) => {
                const timeDiff = task.completedAt.getTime() - task.createdAt.getTime();
                return sum + (timeDiff / (1000 * 60 * 60 * 24));
            }, 0) / completedTasksWithDates.length
            : 0;
        const userIds = userStats.map(stat => stat.assignedToId).filter(Boolean);
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
        });
        const byAssignee = await Promise.all(userStats.map(async ({ assignedToId, _count }) => {
            if (!assignedToId)
                return null;
            const user = users.find(u => u.id === assignedToId);
            const userCompletedTasks = await prisma_1.prisma.task.count({
                where: { tenantId, assignedToId, status: 'COMPLETED' },
            });
            return {
                userId: assignedToId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                totalTasks: _count.assignedToId,
                completedTasks: userCompletedTasks,
                pendingTasks: _count.assignedToId - userCompletedTasks,
                completionRate: _count.assignedToId > 0 ? (userCompletedTasks / _count.assignedToId) * 100 : 0,
            };
        }));
        return {
            total: totalTasks,
            byStatus,
            byPriority,
            overdue: overdueTasks,
            dueToday: dueTodayTasks,
            dueThisWeek: dueThisWeekTasks,
            completed: completedTasks,
            completionRate,
            averageCompletionTime,
            byAssignee: byAssignee.filter(Boolean),
            recentTasks: recentTasks.map(task => ({
                id: task.id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                assigneeName: task.assignedTo
                    ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                    : 'Unassigned',
                createdAt: task.createdAt,
            })),
        };
    }
    async getUpcomingReminders(tenantId, userId) {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const where = {
            tenantId,
            status: { not: 'COMPLETED' },
            OR: [
                { reminderDate: { gte: now, lte: nextWeek } },
                { dueDate: { gte: now, lte: nextWeek } },
            ],
        };
        if (userId) {
            where.assignedToId = userId;
        }
        const tasks = await prisma_1.prisma.task.findMany({
            where,
            include: {
                assignedTo: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: [
                { dueDate: 'asc' },
                { reminderDate: 'asc' },
            ],
        });
        return tasks.map(task => {
            const dueDate = task.dueDate || new Date();
            const isOverdue = dueDate < now;
            const daysDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
                id: task.id,
                taskId: task.id,
                taskTitle: task.title,
                dueDate,
                reminderDate: task.reminderDate || dueDate,
                assigneeName: task.assignedTo
                    ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                    : 'Unassigned',
                priority: task.priority,
                isOverdue,
                daysDue,
            };
        });
    }
    async bulkUpdateTasks(tenantId, taskIds, updates) {
        const existingTasks = await prisma_1.prisma.task.findMany({
            where: {
                id: { in: taskIds },
                tenantId,
            },
            select: { id: true },
        });
        if (existingTasks.length !== taskIds.length) {
            throw new errors_1.NotFoundError('One or more tasks not found');
        }
        const updatedTasks = await prisma_1.prisma.task.updateMany({
            where: {
                id: { in: taskIds },
                tenantId,
            },
            data: {
                ...updates,
                dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
                reminderDate: updates.reminderDate ? new Date(updates.reminderDate) : undefined,
            },
        });
        return {
            updatedCount: updatedTasks.count,
            success: true,
        };
    }
    async getTasksByTag(tenantId, tag) {
        const tasks = await prisma_1.prisma.task.findMany({
            where: {
                tenantId,
                tags: { has: tag },
            },
            include: {
                assignedTo: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return tasks;
    }
    async getAllTags(tenantId) {
        const tasks = await prisma_1.prisma.task.findMany({
            where: { tenantId },
            select: { tags: true },
        });
        const allTags = tasks.flatMap(task => task.tags);
        const uniqueTags = [...new Set(allTags)];
        const tagCounts = uniqueTags.map(tag => ({
            tag,
            count: allTags.filter(t => t === tag).length,
        }));
        return tagCounts.sort((a, b) => b.count - a.count);
    }
}
exports.taskService = new TaskService();
//# sourceMappingURL=taskService.js.map