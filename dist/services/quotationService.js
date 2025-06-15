"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationService = void 0;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
class QuotationService {
    async createQuotation(tenantId, createdBy, data) {
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
        if (data.leadId) {
            const lead = await prisma_1.prisma.lead.findFirst({
                where: { id: data.leadId, tenantId },
            });
            if (!lead) {
                throw new errors_1.NotFoundError('Lead not found');
            }
        }
        const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
        const discounts = data.discounts || 0;
        const taxes = data.taxes || (subtotal - discounts) * 0.1;
        const total = subtotal - discounts + taxes;
        const lastQuotation = await prisma_1.prisma.quotation.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            select: { number: true },
        });
        const nextNumber = this.generateQuotationNumber(lastQuotation?.number);
        const quotation = await prisma_1.prisma.quotation.create({
            data: {
                tenantId,
                clientId: data.clientId,
                opportunityId: data.opportunityId,
                leadId: data.leadId,
                number: nextNumber,
                title: data.title,
                description: data.description,
                items: data.items,
                subtotal,
                discounts,
                taxes,
                total,
                currency: data.currency || 'USD',
                validUntil: new Date(data.validUntil),
                terms: data.terms,
                notes: data.notes,
                createdBy,
                status: 'DRAFT',
            },
            include: {
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
                        stage: true,
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
            },
        });
        return quotation;
    }
    async getQuotations(tenantId, query) {
        const { page, limit, status, clientId, opportunityId, leadId, dateFrom, dateTo, searchTerm, sortBy, sortOrder, } = query;
        const offset = (page - 1) * limit;
        const where = { tenantId };
        if (status)
            where.status = status;
        if (clientId)
            where.clientId = clientId;
        if (opportunityId)
            where.opportunityId = opportunityId;
        if (leadId)
            where.leadId = leadId;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        if (searchTerm) {
            where.OR = [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { number: { contains: searchTerm, mode: 'insensitive' } },
            ];
        }
        const [quotations, total] = await Promise.all([
            prisma_1.prisma.quotation.findMany({
                where,
                include: {
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
                            stage: true,
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
                    contracts: {
                        select: {
                            id: true,
                            number: true,
                            status: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: offset,
                take: limit,
            }),
            prisma_1.prisma.quotation.count({ where }),
        ]);
        return {
            quotations,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getQuotationById(tenantId, quotationId) {
        const quotation = await prisma_1.prisma.quotation.findFirst({
            where: { id: quotationId, tenantId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        address: true,
                    },
                },
                opportunity: {
                    select: {
                        id: true,
                        title: true,
                        stage: true,
                        value: true,
                    },
                },
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        company: true,
                    },
                },
                contracts: {
                    include: {
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!quotation) {
            throw new errors_1.NotFoundError('Quotation not found');
        }
        return quotation;
    }
    async updateQuotation(tenantId, quotationId, data) {
        const existingQuotation = await prisma_1.prisma.quotation.findFirst({
            where: { id: quotationId, tenantId },
        });
        if (!existingQuotation) {
            throw new errors_1.NotFoundError('Quotation not found');
        }
        if (existingQuotation.status === 'CONVERTED' || existingQuotation.status === 'EXPIRED') {
            throw new errors_1.ValidationError('Cannot update converted or expired quotation');
        }
        let updateData = { ...data };
        if (data.items) {
            const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
            const discounts = data.discounts || existingQuotation.discounts.toNumber();
            const taxes = data.taxes || (subtotal - discounts) * 0.1;
            const total = subtotal - discounts + taxes;
            updateData = {
                ...updateData,
                items: data.items,
                subtotal,
                taxes,
                total,
            };
        }
        if (data.validUntil) {
            updateData.validUntil = new Date(data.validUntil);
        }
        const quotation = await prisma_1.prisma.quotation.update({
            where: { id: quotationId },
            data: updateData,
            include: {
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
                        stage: true,
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
            },
        });
        return quotation;
    }
    async deleteQuotation(tenantId, quotationId) {
        const quotation = await prisma_1.prisma.quotation.findFirst({
            where: { id: quotationId, tenantId },
            include: {
                contracts: true,
            },
        });
        if (!quotation) {
            throw new errors_1.NotFoundError('Quotation not found');
        }
        if (quotation.contracts.length > 0) {
            throw new errors_1.ValidationError('Cannot delete quotation with associated contracts');
        }
        await prisma_1.prisma.quotation.delete({
            where: { id: quotationId },
        });
        return { success: true };
    }
    async sendQuotation(tenantId, quotationId) {
        const quotation = await prisma_1.prisma.quotation.findFirst({
            where: { id: quotationId, tenantId },
        });
        if (!quotation) {
            throw new errors_1.NotFoundError('Quotation not found');
        }
        if (quotation.status !== 'DRAFT') {
            throw new errors_1.ValidationError('Only draft quotations can be sent');
        }
        if (quotation.validUntil < new Date()) {
            throw new errors_1.ValidationError('Cannot send expired quotation');
        }
        const updatedQuotation = await prisma_1.prisma.quotation.update({
            where: { id: quotationId },
            data: { status: 'SENT' },
        });
        return updatedQuotation;
    }
    async markQuotationAsViewed(tenantId, quotationId) {
        const quotation = await prisma_1.prisma.quotation.findFirst({
            where: { id: quotationId, tenantId },
        });
        if (!quotation) {
            throw new errors_1.NotFoundError('Quotation not found');
        }
        if (quotation.status === 'SENT') {
            const updatedQuotation = await prisma_1.prisma.quotation.update({
                where: { id: quotationId },
                data: { status: 'VIEWED' },
            });
            return updatedQuotation;
        }
        return quotation;
    }
    async acceptQuotation(tenantId, quotationId, approvedBy) {
        const quotation = await prisma_1.prisma.quotation.findFirst({
            where: { id: quotationId, tenantId },
        });
        if (!quotation) {
            throw new errors_1.NotFoundError('Quotation not found');
        }
        if (!['SENT', 'VIEWED'].includes(quotation.status)) {
            throw new errors_1.ValidationError('Only sent or viewed quotations can be accepted');
        }
        if (quotation.validUntil < new Date()) {
            throw new errors_1.ValidationError('Cannot accept expired quotation');
        }
        const updatedQuotation = await prisma_1.prisma.quotation.update({
            where: { id: quotationId },
            data: {
                status: 'ACCEPTED',
                approvedBy,
                approvedAt: new Date(),
            },
        });
        return updatedQuotation;
    }
    async rejectQuotation(tenantId, quotationId, reason) {
        const quotation = await prisma_1.prisma.quotation.findFirst({
            where: { id: quotationId, tenantId },
        });
        if (!quotation) {
            throw new errors_1.NotFoundError('Quotation not found');
        }
        if (!['SENT', 'VIEWED'].includes(quotation.status)) {
            throw new errors_1.ValidationError('Only sent or viewed quotations can be rejected');
        }
        const updatedQuotation = await prisma_1.prisma.quotation.update({
            where: { id: quotationId },
            data: {
                status: 'REJECTED',
                notes: reason ? `${quotation.notes || ''}\n\nRejection reason: ${reason}`.trim() : quotation.notes,
            },
        });
        return updatedQuotation;
    }
    async convertToContract(tenantId, quotationId, createdBy, contractData) {
        const quotation = await prisma_1.prisma.quotation.findFirst({
            where: { id: quotationId, tenantId },
            include: {
                client: true,
            },
        });
        if (!quotation) {
            throw new errors_1.NotFoundError('Quotation not found');
        }
        if (quotation.status !== 'ACCEPTED') {
            throw new errors_1.ValidationError('Only accepted quotations can be converted to contracts');
        }
        if (!quotation.clientId) {
            throw new errors_1.ValidationError('Quotation must be associated with a client to create a contract');
        }
        const lastContract = await prisma_1.prisma.contract.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            select: { number: true },
        });
        const contractNumber = this.generateContractNumber(lastContract?.number);
        const contract = await prisma_1.prisma.contract.create({
            data: {
                tenantId,
                clientId: quotation.clientId,
                quotationId: quotation.id,
                number: contractNumber,
                title: contractData.title,
                description: contractData.description,
                terms: contractData.terms,
                amount: quotation.total,
                currency: quotation.currency,
                status: 'DRAFT',
                startDate: new Date(contractData.startDate),
                endDate: contractData.endDate ? new Date(contractData.endDate) : undefined,
                autoRenew: contractData.autoRenew || false,
                renewalPeriod: contractData.renewalPeriod,
                createdBy,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                quotation: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                    },
                },
            },
        });
        await prisma_1.prisma.quotation.update({
            where: { id: quotationId },
            data: { status: 'CONVERTED' },
        });
        return contract;
    }
    async getQuotationStats(tenantId) {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const [totalQuotations, statusStats, totalSent, totalAccepted, expiringQuotations, recentQuotations] = await Promise.all([
            prisma_1.prisma.quotation.count({ where: { tenantId } }),
            prisma_1.prisma.quotation.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: { status: true },
                _sum: { total: true },
            }),
            prisma_1.prisma.quotation.count({
                where: { tenantId, status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'REJECTED'] } },
            }),
            prisma_1.prisma.quotation.count({
                where: { tenantId, status: 'ACCEPTED' },
            }),
            prisma_1.prisma.quotation.count({
                where: {
                    tenantId,
                    status: { in: ['SENT', 'VIEWED'] },
                    validUntil: { gte: now, lte: weekFromNow },
                },
            }),
            prisma_1.prisma.quotation.findMany({
                where: { tenantId },
                include: {
                    client: {
                        select: { name: true },
                    },
                    lead: {
                        select: { firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        const byStatus = statusStats.map(({ status, _count, _sum }) => ({
            status,
            count: _count.status,
            percentage: totalQuotations > 0 ? (_count.status / totalQuotations) * 100 : 0,
        }));
        const totalValue = statusStats.reduce((sum, stat) => sum + (stat._sum.total?.toNumber() || 0), 0);
        const averageValue = totalQuotations > 0 ? totalValue / totalQuotations : 0;
        const acceptanceRate = totalSent > 0 ? (totalAccepted / totalSent) * 100 : 0;
        return {
            total: totalQuotations,
            byStatus,
            totalValue,
            acceptanceRate,
            averageValue,
            expiringThisWeek: expiringQuotations,
            recentQuotations: recentQuotations.map(q => ({
                id: q.id,
                number: q.number,
                title: q.title,
                status: q.status,
                total: q.total.toNumber(),
                clientName: q.client?.name || (q.lead ? `${q.lead.firstName} ${q.lead.lastName}` : undefined),
                createdAt: q.createdAt,
            })),
        };
    }
    async duplicateQuotation(tenantId, quotationId, createdBy) {
        const originalQuotation = await prisma_1.prisma.quotation.findFirst({
            where: { id: quotationId, tenantId },
        });
        if (!originalQuotation) {
            throw new errors_1.NotFoundError('Quotation not found');
        }
        const lastQuotation = await prisma_1.prisma.quotation.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            select: { number: true },
        });
        const newNumber = this.generateQuotationNumber(lastQuotation?.number);
        const newValidUntil = new Date();
        newValidUntil.setDate(newValidUntil.getDate() + 30);
        const duplicatedQuotation = await prisma_1.prisma.quotation.create({
            data: {
                tenantId,
                clientId: originalQuotation.clientId,
                opportunityId: originalQuotation.opportunityId,
                leadId: originalQuotation.leadId,
                number: newNumber,
                title: `${originalQuotation.title} (Copy)`,
                description: originalQuotation.description,
                items: originalQuotation.items,
                subtotal: originalQuotation.subtotal,
                discounts: originalQuotation.discounts,
                taxes: originalQuotation.taxes,
                total: originalQuotation.total,
                currency: originalQuotation.currency,
                validUntil: newValidUntil,
                terms: originalQuotation.terms,
                notes: originalQuotation.notes,
                createdBy,
                status: 'DRAFT',
            },
        });
        return duplicatedQuotation;
    }
    generateQuotationNumber(lastNumber) {
        if (!lastNumber) {
            return 'QUO-001';
        }
        const match = lastNumber.match(/QUO-(\d+)/);
        if (!match) {
            return 'QUO-001';
        }
        const nextNumber = parseInt(match[1]) + 1;
        return `QUO-${nextNumber.toString().padStart(3, '0')}`;
    }
    generateContractNumber(lastNumber) {
        if (!lastNumber) {
            return 'CON-001';
        }
        const match = lastNumber.match(/CON-(\d+)/);
        if (!match) {
            return 'CON-001';
        }
        const nextNumber = parseInt(match[1]) + 1;
        return `CON-${nextNumber.toString().padStart(3, '0')}`;
    }
}
exports.quotationService = new QuotationService();
//# sourceMappingURL=quotationService.js.map