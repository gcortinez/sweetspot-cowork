"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationService = void 0;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
class CommunicationService {
    async createCommunication(tenantId, userId, data) {
        if (!data.leadId && !data.clientId && !data.opportunityId) {
            throw new errors_1.ValidationError('Communication must be associated with a lead, client, or opportunity');
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
        const communication = await prisma_1.prisma.communication.create({
            data: {
                ...data,
                tenantId,
                userId,
                attachments: data.attachments || [],
                metadata: data.metadata || {},
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                lead: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                client: {
                    select: {
                        name: true,
                        email: true,
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
        return communication;
    }
    async getCommunications(tenantId, query) {
        const { page, limit, type, direction, entityType, entityId, dateFrom, dateTo, searchTerm, sortBy, sortOrder } = query;
        const offset = (page - 1) * limit;
        const where = { tenantId };
        if (type)
            where.type = type;
        if (direction)
            where.direction = direction;
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
            }
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        if (searchTerm) {
            where.OR = [
                { subject: { contains: searchTerm, mode: 'insensitive' } },
                { content: { contains: searchTerm, mode: 'insensitive' } },
                { fromEmail: { contains: searchTerm, mode: 'insensitive' } },
                { toEmail: { contains: searchTerm, mode: 'insensitive' } },
            ];
        }
        const [communications, total] = await Promise.all([
            prisma_1.prisma.communication.findMany({
                where,
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    lead: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    client: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    opportunity: {
                        select: {
                            title: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: offset,
                take: limit,
            }),
            prisma_1.prisma.communication.count({ where }),
        ]);
        return {
            communications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getCommunicationById(tenantId, communicationId) {
        const communication = await prisma_1.prisma.communication.findFirst({
            where: { id: communicationId, tenantId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
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
        if (!communication) {
            throw new errors_1.NotFoundError('Communication not found');
        }
        return communication;
    }
    async updateCommunication(tenantId, communicationId, data) {
        const existingCommunication = await prisma_1.prisma.communication.findFirst({
            where: { id: communicationId, tenantId },
        });
        if (!existingCommunication) {
            throw new errors_1.NotFoundError('Communication not found');
        }
        const communication = await prisma_1.prisma.communication.update({
            where: { id: communicationId },
            data: {
                ...data,
                attachments: data.attachments || existingCommunication.attachments,
                metadata: data.metadata || existingCommunication.metadata,
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                lead: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                client: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return communication;
    }
    async deleteCommunication(tenantId, communicationId) {
        const communication = await prisma_1.prisma.communication.findFirst({
            where: { id: communicationId, tenantId },
        });
        if (!communication) {
            throw new errors_1.NotFoundError('Communication not found');
        }
        await prisma_1.prisma.communication.delete({
            where: { id: communicationId },
        });
        return { success: true };
    }
    async getCommunicationThread(tenantId, entityType, entityId) {
        let entityName = '';
        switch (entityType) {
            case 'LEAD':
                const lead = await prisma_1.prisma.lead.findFirst({
                    where: { id: entityId, tenantId },
                });
                if (!lead)
                    throw new errors_1.NotFoundError('Lead not found');
                entityName = `${lead.firstName} ${lead.lastName}`;
                break;
            case 'CLIENT':
                const client = await prisma_1.prisma.client.findFirst({
                    where: { id: entityId, tenantId },
                });
                if (!client)
                    throw new errors_1.NotFoundError('Client not found');
                entityName = client.name;
                break;
            case 'OPPORTUNITY':
                const opportunity = await prisma_1.prisma.opportunity.findFirst({
                    where: { id: entityId, tenantId },
                });
                if (!opportunity)
                    throw new errors_1.NotFoundError('Opportunity not found');
                entityName = opportunity.title;
                break;
        }
        const whereCondition = { tenantId };
        switch (entityType) {
            case 'LEAD':
                whereCondition.leadId = entityId;
                break;
            case 'CLIENT':
                whereCondition.clientId = entityId;
                break;
            case 'OPPORTUNITY':
                whereCondition.opportunityId = entityId;
                break;
        }
        const [communications, totalCount] = await Promise.all([
            prisma_1.prisma.communication.findMany({
                where: whereCondition,
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.communication.count({ where: whereCondition }),
        ]);
        return {
            entityType,
            entityId,
            entityName,
            communications,
            totalCount,
        };
    }
    async getCommunicationStats(tenantId) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [totalCommunications, weeklyCount, monthlyCount, typeStats, directionStats, userStats, recentCommunications,] = await Promise.all([
            prisma_1.prisma.communication.count({ where: { tenantId } }),
            prisma_1.prisma.communication.count({
                where: { tenantId, createdAt: { gte: startOfWeek } },
            }),
            prisma_1.prisma.communication.count({
                where: { tenantId, createdAt: { gte: startOfMonth } },
            }),
            prisma_1.prisma.communication.groupBy({
                by: ['type'],
                where: { tenantId },
                _count: { type: true },
            }),
            prisma_1.prisma.communication.groupBy({
                by: ['direction'],
                where: { tenantId },
                _count: { direction: true },
            }),
            prisma_1.prisma.communication.groupBy({
                by: ['userId'],
                where: { tenantId },
                _count: { userId: true },
                orderBy: { _count: { userId: 'desc' } },
                take: 5,
            }),
            prisma_1.prisma.communication.findMany({
                where: { tenantId },
                include: {
                    user: {
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
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        const byType = typeStats.map(({ type, _count }) => ({
            type,
            count: _count.type,
            percentage: totalCommunications > 0 ? (_count.type / totalCommunications) * 100 : 0,
        }));
        const byDirection = directionStats.map(({ direction, _count }) => ({
            direction,
            count: _count.direction,
            percentage: totalCommunications > 0 ? (_count.direction / totalCommunications) * 100 : 0,
        }));
        const userIds = userStats.map(stat => stat.userId);
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
        });
        const mostActiveUsers = userStats.map(({ userId, _count }) => {
            const user = users.find(u => u.id === userId);
            return {
                userId,
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                communicationCount: _count.userId,
            };
        });
        const averageResponseTime = 2.5;
        return {
            total: totalCommunications,
            byType,
            byDirection,
            thisWeek: weeklyCount,
            thisMonth: monthlyCount,
            averageResponseTime,
            mostActiveUsers,
            recentCommunications: recentCommunications.map(comm => ({
                id: comm.id,
                type: comm.type,
                direction: comm.direction,
                subject: comm.subject,
                entityName: comm.lead
                    ? `${comm.lead.firstName} ${comm.lead.lastName}`
                    : comm.client
                        ? comm.client.name
                        : comm.opportunity
                            ? comm.opportunity.title
                            : 'Unknown',
                userName: `${comm.user.firstName} ${comm.user.lastName}`,
                createdAt: comm.createdAt,
            })),
        };
    }
    async markAsRead(tenantId, communicationId, userId) {
        const communication = await prisma_1.prisma.communication.findFirst({
            where: { id: communicationId, tenantId },
        });
        if (!communication) {
            throw new errors_1.NotFoundError('Communication not found');
        }
        const metadata = communication.metadata || {};
        metadata.readBy = metadata.readBy || [];
        if (!metadata.readBy.includes(userId)) {
            metadata.readBy.push(userId);
            metadata.readAt = new Date().toISOString();
        }
        const updatedCommunication = await prisma_1.prisma.communication.update({
            where: { id: communicationId },
            data: { metadata },
        });
        return updatedCommunication;
    }
    async bulkDelete(tenantId, communicationIds) {
        const existingCommunications = await prisma_1.prisma.communication.findMany({
            where: {
                id: { in: communicationIds },
                tenantId,
            },
            select: { id: true },
        });
        if (existingCommunications.length !== communicationIds.length) {
            throw new errors_1.NotFoundError('One or more communications not found');
        }
        const deletedCount = await prisma_1.prisma.communication.deleteMany({
            where: {
                id: { in: communicationIds },
                tenantId,
            },
        });
        return {
            deletedCount: deletedCount.count,
            success: true,
        };
    }
}
exports.communicationService = new CommunicationService();
//# sourceMappingURL=communicationService.js.map