"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityService = void 0;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
class OpportunityService {
    async getOpportunities(tenantId, query) {
        const { page, limit, search, stage, assignedToId, leadId, clientId, minValue, maxValue, sortBy, sortOrder } = query;
        const offset = (page - 1) * limit;
        const where = { tenantId };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { competitorInfo: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (stage)
            where.stage = stage;
        if (assignedToId)
            where.assignedToId = assignedToId;
        if (leadId)
            where.leadId = leadId;
        if (clientId)
            where.clientId = clientId;
        if (minValue !== undefined || maxValue !== undefined) {
            where.value = {};
            if (minValue !== undefined)
                where.value.gte = minValue;
            if (maxValue !== undefined)
                where.value.lte = maxValue;
        }
        const [opportunities, total] = await Promise.all([
            prisma_1.prisma.opportunity.findMany({
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
                    lead: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    quotations: {
                        select: {
                            id: true,
                            total: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                    _count: {
                        select: {
                            activities: true,
                            tasks: true,
                            quotations: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: offset,
                take: limit,
            }),
            prisma_1.prisma.opportunity.count({ where }),
        ]);
        return {
            opportunities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getOpportunityById(tenantId, opportunityId) {
        const opportunity = await prisma_1.prisma.opportunity.findFirst({
            where: { id: opportunityId, tenantId },
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
                    },
                },
                activities: {
                    select: {
                        id: true,
                        type: true,
                        subject: true,
                        dueDate: true,
                        completedAt: true,
                        outcome: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
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
                        assignedTo: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                quotations: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        total: true,
                        status: true,
                        validUntil: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!opportunity) {
            throw new errors_1.NotFoundError('Opportunity not found');
        }
        return opportunity;
    }
    async createOpportunity(tenantId, data) {
        if (data.assignedToId) {
            const assignedUser = await prisma_1.prisma.user.findFirst({
                where: { id: data.assignedToId, tenantId },
            });
            if (!assignedUser) {
                throw new errors_1.ValidationError('Assigned user not found');
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
        if (data.clientId) {
            const client = await prisma_1.prisma.client.findFirst({
                where: { id: data.clientId, tenantId },
            });
            if (!client) {
                throw new errors_1.ValidationError('Client not found');
            }
        }
        const expectedRevenue = data.expectedRevenue || (data.value * data.probability) / 100;
        const opportunity = await prisma_1.prisma.opportunity.create({
            data: {
                ...data,
                tenantId,
                expectedRevenue,
                expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
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
            },
        });
        return opportunity;
    }
    async updateOpportunity(tenantId, opportunityId, data) {
        const existingOpportunity = await prisma_1.prisma.opportunity.findFirst({
            where: { id: opportunityId, tenantId },
        });
        if (!existingOpportunity) {
            throw new errors_1.NotFoundError('Opportunity not found');
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
        if (data.value !== undefined || data.probability !== undefined) {
            const value = data.value !== undefined ? data.value : existingOpportunity.value;
            const probability = data.probability !== undefined ? data.probability : existingOpportunity.probability;
            updateData.expectedRevenue = (Number(value) * probability) / 100;
        }
        if (data.stage && (data.stage === 'CLOSED_WON' || data.stage === 'CLOSED_LOST') && !data.actualCloseDate) {
            updateData.actualCloseDate = new Date();
        }
        if (data.expectedCloseDate) {
            updateData.expectedCloseDate = new Date(data.expectedCloseDate);
        }
        if (data.actualCloseDate) {
            updateData.actualCloseDate = new Date(data.actualCloseDate);
        }
        const opportunity = await prisma_1.prisma.opportunity.update({
            where: { id: opportunityId },
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
            },
        });
        return opportunity;
    }
    async deleteOpportunity(tenantId, opportunityId) {
        const opportunity = await prisma_1.prisma.opportunity.findFirst({
            where: { id: opportunityId, tenantId },
            include: {
                quotations: true,
                conversions: true,
            },
        });
        if (!opportunity) {
            throw new errors_1.NotFoundError('Opportunity not found');
        }
        if (opportunity.quotations.length > 0 || opportunity.conversions.length > 0) {
            throw new errors_1.ValidationError('Cannot delete opportunity with associated quotations or conversions');
        }
        await prisma_1.prisma.opportunity.delete({
            where: { id: opportunityId },
        });
    }
    async updateStage(tenantId, opportunityId, stage, userId, reason, notes) {
        const opportunity = await prisma_1.prisma.opportunity.findFirst({
            where: { id: opportunityId, tenantId },
        });
        if (!opportunity) {
            throw new errors_1.NotFoundError('Opportunity not found');
        }
        const updateData = { stage };
        if (stage === 'CLOSED_WON' || stage === 'CLOSED_LOST') {
            updateData.actualCloseDate = new Date();
            if (stage === 'CLOSED_LOST' && reason) {
                updateData.lostReason = reason;
            }
        }
        const updatedOpportunity = await prisma_1.prisma.opportunity.update({
            where: { id: opportunityId },
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
        await prisma_1.prisma.activity.create({
            data: {
                tenantId,
                type: 'NOTE',
                subject: `Stage changed to ${stage}`,
                description: notes || `Opportunity stage changed from ${opportunity.stage} to ${stage}${reason ? `. Reason: ${reason}` : ''}`,
                opportunityId,
                userId,
                completedAt: new Date(),
            },
        });
        return updatedOpportunity;
    }
    async assignOpportunity(tenantId, opportunityId, assignedToId) {
        const assignedUser = await prisma_1.prisma.user.findFirst({
            where: { id: assignedToId, tenantId },
        });
        if (!assignedUser) {
            throw new errors_1.ValidationError('Assigned user not found');
        }
        const opportunity = await prisma_1.prisma.opportunity.update({
            where: { id: opportunityId, tenantId },
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
        return opportunity;
    }
    async getPipelineStats(tenantId) {
        const [totalCount, stageStats, valueStats, closedOpportunities,] = await Promise.all([
            prisma_1.prisma.opportunity.count({ where: { tenantId } }),
            prisma_1.prisma.opportunity.groupBy({
                by: ['stage'],
                where: { tenantId },
                _count: { stage: true },
                _sum: { value: true },
                _avg: { probability: true },
            }),
            prisma_1.prisma.opportunity.aggregate({
                where: { tenantId },
                _sum: { value: true, expectedRevenue: true },
                _avg: { value: true, probability: true },
            }),
            prisma_1.prisma.opportunity.findMany({
                where: {
                    tenantId,
                    stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] },
                },
                select: {
                    stage: true,
                    createdAt: true,
                    actualCloseDate: true,
                },
            }),
        ]);
        const byStage = {};
        stageStats.forEach(({ stage, _count, _sum, _avg }) => {
            byStage[stage] = {
                count: _count.stage,
                value: Number(_sum.value || 0),
                probability: Number(_avg.probability || 0),
            };
        });
        const conversionRates = {};
        const wonCount = closedOpportunities.filter(op => op.stage === 'CLOSED_WON').length;
        const totalClosed = closedOpportunities.length;
        conversionRates.winRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;
        const salesCycles = closedOpportunities
            .filter(op => op.actualCloseDate)
            .map(op => {
            const created = new Date(op.createdAt);
            const closed = new Date(op.actualCloseDate);
            return Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });
        const averageSalesycle = salesCycles.length > 0
            ? salesCycles.reduce((sum, cycle) => sum + cycle, 0) / salesCycles.length
            : 0;
        return {
            totalOpportunities: totalCount,
            totalValue: Number(valueStats._sum.value || 0),
            averageValue: Number(valueStats._avg.value || 0),
            averageProbability: Number(valueStats._avg.probability || 0),
            expectedRevenue: Number(valueStats._sum.expectedRevenue || 0),
            byStage,
            conversionRates,
            averageSalescycle,
        };
    }
    async getPipelineFunnel(tenantId) {
        const stageOrder = [
            'INITIAL_CONTACT',
            'NEEDS_ANALYSIS',
            'PROPOSAL_SENT',
            'NEGOTIATION',
            'CLOSED_WON',
            'CLOSED_LOST'
        ];
        const stageNames = {
            INITIAL_CONTACT: 'Initial Contact',
            NEEDS_ANALYSIS: 'Needs Analysis',
            PROPOSAL_SENT: 'Proposal Sent',
            NEGOTIATION: 'Negotiation',
            CLOSED_WON: 'Closed Won',
            CLOSED_LOST: 'Closed Lost'
        };
        const opportunities = await prisma_1.prisma.opportunity.findMany({
            where: { tenantId },
            include: {
                assignedTo: {
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
            },
        });
        const totalOpportunities = opportunities.length;
        const stages = stageOrder.map((stage, index) => {
            const stageOpportunities = opportunities.filter(op => op.stage === stage);
            const count = stageOpportunities.length;
            const value = stageOpportunities.reduce((sum, op) => sum + Number(op.value), 0);
            let conversionRate = 100;
            if (index > 0) {
                const previousStageCount = opportunities.filter(op => {
                    const currentIndex = stageOrder.indexOf(op.stage);
                    return currentIndex >= index - 1;
                }).length;
                conversionRate = previousStageCount > 0 ? (count / previousStageCount) * 100 : 0;
            }
            return {
                stage,
                name: stageNames[stage],
                count,
                value,
                conversionRate,
                opportunities: stageOpportunities.map(op => ({
                    id: op.id,
                    title: op.title,
                    value: Number(op.value),
                    probability: op.probability,
                    assignedTo: op.assignedTo ? {
                        firstName: op.assignedTo.firstName,
                        lastName: op.assignedTo.lastName,
                    } : undefined,
                    lead: op.lead ? {
                        firstName: op.lead.firstName,
                        lastName: op.lead.lastName,
                    } : undefined,
                    client: op.client ? {
                        name: op.client.name,
                    } : undefined,
                })),
            };
        });
        return { stages };
    }
    async createOpportunityFromLead(tenantId, leadId, data) {
        const lead = await prisma_1.prisma.lead.findFirst({
            where: { id: leadId, tenantId },
        });
        if (!lead) {
            throw new errors_1.NotFoundError('Lead not found');
        }
        const opportunity = await this.createOpportunity(tenantId, {
            ...data,
            leadId,
            clientId: lead.clientId || data.clientId,
        });
        if (lead.status !== 'CONVERTED') {
            await prisma_1.prisma.lead.update({
                where: { id: leadId },
                data: { status: 'QUALIFIED' },
            });
        }
        return opportunity;
    }
}
exports.opportunityService = new OpportunityService();
//# sourceMappingURL=opportunityService.js.map