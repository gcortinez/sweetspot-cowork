"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadService = void 0;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
class LeadService {
    async getLeads(tenantId, query) {
        const { page, limit, search, status, source, assignedToId, sortBy, sortOrder } = query;
        const offset = (page - 1) * limit;
        const where = { tenantId };
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        if (source)
            where.source = source;
        if (assignedToId)
            where.assignedToId = assignedToId;
        const [leads, total] = await Promise.all([
            prisma_1.prisma.lead.findMany({
                where,
                include: {
                    assignedTo: {
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
                    _count: {
                        select: {
                            opportunities: true,
                            activities: true,
                            tasks: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: offset,
                take: limit,
            }),
            prisma_1.prisma.lead.count({ where }),
        ]);
        return {
            leads,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getLeadById(tenantId, leadId) {
        const lead = await prisma_1.prisma.lead.findFirst({
            where: { id: leadId, tenantId },
            include: {
                assignedTo: {
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
                opportunities: {
                    select: {
                        id: true,
                        title: true,
                        value: true,
                        stage: true,
                        expectedCloseDate: true,
                    },
                },
                activities: {
                    select: {
                        id: true,
                        type: true,
                        subject: true,
                        dueDate: true,
                        completedAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        priority: true,
                        status: true,
                        dueDate: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                communications: {
                    select: {
                        id: true,
                        type: true,
                        subject: true,
                        direction: true,
                        status: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!lead) {
            throw new errors_1.NotFoundError('Lead not found');
        }
        return lead;
    }
    async createLead(tenantId, data) {
        const existingLead = await prisma_1.prisma.lead.findFirst({
            where: { tenantId, email: data.email },
        });
        if (existingLead) {
            throw new errors_1.ConflictError('Lead with this email already exists');
        }
        if (data.assignedToId) {
            const assignedUser = await prisma_1.prisma.user.findFirst({
                where: { id: data.assignedToId, tenantId },
            });
            if (!assignedUser) {
                throw new errors_1.ValidationError('Assigned user not found');
            }
        }
        const lead = await prisma_1.prisma.lead.create({
            data: {
                ...data,
                tenantId,
                interests: data.interests || [],
                score: data.score || 0,
                status: 'NEW',
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        return lead;
    }
    async updateLead(tenantId, leadId, data) {
        const existingLead = await prisma_1.prisma.lead.findFirst({
            where: { id: leadId, tenantId },
        });
        if (!existingLead) {
            throw new errors_1.NotFoundError('Lead not found');
        }
        if (data.email && data.email !== existingLead.email) {
            const emailExists = await prisma_1.prisma.lead.findFirst({
                where: { tenantId, email: data.email, id: { not: leadId } },
            });
            if (emailExists) {
                throw new errors_1.ConflictError('Lead with this email already exists');
            }
        }
        if (data.assignedToId) {
            const assignedUser = await prisma_1.prisma.user.findFirst({
                where: { id: data.assignedToId, tenantId },
            });
            if (!assignedUser) {
                throw new errors_1.ValidationError('Assigned user not found');
            }
        }
        const updateData = { ...data };
        if (data.status === 'CONTACTED' && existingLead.status !== 'CONTACTED') {
            updateData.lastContactAt = new Date();
        }
        const lead = await prisma_1.prisma.lead.update({
            where: { id: leadId },
            data: updateData,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        return lead;
    }
    async deleteLead(tenantId, leadId) {
        const lead = await prisma_1.prisma.lead.findFirst({
            where: { id: leadId, tenantId },
            include: {
                opportunities: true,
                conversions: true,
            },
        });
        if (!lead) {
            throw new errors_1.NotFoundError('Lead not found');
        }
        if (lead.opportunities.length > 0 || lead.conversions.length > 0) {
            throw new errors_1.ValidationError('Cannot delete lead with associated opportunities or conversions');
        }
        await prisma_1.prisma.lead.delete({
            where: { id: leadId },
        });
    }
    async assignLead(tenantId, leadId, assignedToId) {
        const assignedUser = await prisma_1.prisma.user.findFirst({
            where: { id: assignedToId, tenantId },
        });
        if (!assignedUser) {
            throw new errors_1.AppError('Assigned user not found', 400);
        }
        const lead = await prisma_1.prisma.lead.update({
            where: { id: leadId, tenantId },
            data: { assignedToId },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        return lead;
    }
    async updateLeadScore(tenantId, leadId, score) {
        const lead = await prisma_1.prisma.lead.update({
            where: { id: leadId, tenantId },
            data: { score },
        });
        return lead;
    }
    async addLeadNote(tenantId, leadId, note) {
        const lead = await prisma_1.prisma.lead.findFirst({
            where: { id: leadId, tenantId },
        });
        if (!lead) {
            throw new errors_1.NotFoundError('Lead not found');
        }
        const currentNotes = lead.qualificationNotes || '';
        const timestamp = new Date().toISOString();
        const newNote = `${timestamp}: ${note}`;
        const updatedNotes = currentNotes
            ? `${currentNotes}\n\n${newNote}`
            : newNote;
        const updatedLead = await prisma_1.prisma.lead.update({
            where: { id: leadId },
            data: { qualificationNotes: updatedNotes },
        });
        return updatedLead;
    }
    async getLeadStats(tenantId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [total, statusCounts, sourceCounts, averageScore, conversionCount, recentLeads,] = await Promise.all([
            prisma_1.prisma.lead.count({ where: { tenantId } }),
            prisma_1.prisma.lead.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: { status: true },
            }),
            prisma_1.prisma.lead.groupBy({
                by: ['source'],
                where: { tenantId },
                _count: { source: true },
            }),
            prisma_1.prisma.lead.aggregate({
                where: { tenantId },
                _avg: { score: true },
            }),
            prisma_1.prisma.leadConversion.count({
                where: { tenantId },
            }),
            prisma_1.prisma.lead.count({
                where: {
                    tenantId,
                    createdAt: { gte: thirtyDaysAgo },
                },
            }),
        ]);
        const byStatus = {};
        statusCounts.forEach(({ status, _count }) => {
            byStatus[status] = _count.status;
        });
        const bySource = {};
        sourceCounts.forEach(({ source, _count }) => {
            bySource[source] = _count.source;
        });
        return {
            total,
            byStatus,
            bySource,
            averageScore: averageScore._avg.score || 0,
            conversionRate: total > 0 ? (conversionCount / total) * 100 : 0,
            recentLeads,
        };
    }
}
exports.leadService = new LeadService();
//# sourceMappingURL=leadService.js.map