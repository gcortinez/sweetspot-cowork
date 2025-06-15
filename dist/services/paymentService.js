"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
class PaymentService {
    async createPayment(tenantId, data) {
        const client = await prisma_1.prisma.client.findFirst({
            where: { id: data.clientId, tenantId },
        });
        if (!client) {
            throw new errors_1.NotFoundError('Client not found');
        }
        if (data.invoiceId) {
            const invoice = await prisma_1.prisma.invoice.findFirst({
                where: { id: data.invoiceId, tenantId, clientId: data.clientId },
            });
            if (!invoice) {
                throw new errors_1.NotFoundError('Invoice not found');
            }
            if (invoice.status === 'PAID') {
                throw new errors_1.ValidationError('Invoice is already paid');
            }
        }
        const payment = await prisma_1.prisma.payment.create({
            data: {
                tenantId,
                clientId: data.clientId,
                invoiceId: data.invoiceId,
                amount: data.amount,
                currency: data.currency || 'USD',
                method: data.method,
                reference: data.reference,
                status: 'PENDING',
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invoice: {
                    select: {
                        id: true,
                        number: true,
                        total: true,
                        status: true,
                    },
                },
            },
        });
        return payment;
    }
    async processPayment(tenantId, paymentId, data) {
        const payment = await prisma_1.prisma.payment.findFirst({
            where: { id: paymentId, tenantId },
            include: {
                invoice: true,
            },
        });
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found');
        }
        if (payment.status !== 'PENDING') {
            throw new errors_1.ValidationError('Payment is not in pending status');
        }
        let status = 'COMPLETED';
        let processedAt = new Date();
        switch (payment.method) {
            case 'STRIPE':
                status = Math.random() > 0.1 ? 'COMPLETED' : 'FAILED';
                break;
            case 'PAYPAL':
                status = Math.random() > 0.05 ? 'COMPLETED' : 'FAILED';
                break;
            case 'CREDIT_CARD':
            case 'DEBIT_CARD':
                status = Math.random() > 0.08 ? 'COMPLETED' : 'FAILED';
                break;
            case 'BANK_TRANSFER':
                status = Math.random() > 0.5 ? 'COMPLETED' : 'PENDING';
                break;
            case 'CASH':
                status = 'COMPLETED';
                break;
            default:
                status = 'COMPLETED';
        }
        const updatedPayment = await prisma_1.prisma.$transaction(async (tx) => {
            const updated = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status,
                    processedAt: status === 'COMPLETED' ? processedAt : null,
                    reference: data.transactionId || payment.reference,
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    invoice: {
                        select: {
                            id: true,
                            number: true,
                            total: true,
                            status: true,
                        },
                    },
                },
            });
            if (status === 'COMPLETED' && payment.invoice) {
                const totalPaid = await tx.payment.aggregate({
                    where: {
                        invoiceId: payment.invoiceId,
                        status: 'COMPLETED',
                    },
                    _sum: {
                        amount: true,
                    },
                });
                const totalPaidAmount = totalPaid._sum.amount?.toNumber() || 0;
                const invoiceTotal = payment.invoice.total.toNumber();
                if (totalPaidAmount >= invoiceTotal) {
                    await tx.invoice.update({
                        where: { id: payment.invoiceId },
                        data: {
                            status: 'PAID',
                            paidAt: new Date(),
                        },
                    });
                }
            }
            return updated;
        });
        return updatedPayment;
    }
    async getPayments(tenantId, query) {
        const { page, limit, clientId, invoiceId, method, status, dateFrom, dateTo, sortBy, sortOrder, } = query;
        const offset = (page - 1) * limit;
        const where = { tenantId };
        if (clientId)
            where.clientId = clientId;
        if (invoiceId)
            where.invoiceId = invoiceId;
        if (method)
            where.method = method;
        if (status)
            where.status = status;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        const [payments, total] = await Promise.all([
            prisma_1.prisma.payment.findMany({
                where,
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    invoice: {
                        select: {
                            id: true,
                            number: true,
                            total: true,
                            status: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: offset,
                take: limit,
            }),
            prisma_1.prisma.payment.count({ where }),
        ]);
        return {
            payments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getPaymentById(tenantId, paymentId) {
        const payment = await prisma_1.prisma.payment.findFirst({
            where: { id: paymentId, tenantId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                invoice: {
                    select: {
                        id: true,
                        number: true,
                        total: true,
                        status: true,
                        dueDate: true,
                    },
                },
            },
        });
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found');
        }
        return payment;
    }
    async refundPayment(tenantId, paymentId, amount) {
        const payment = await prisma_1.prisma.payment.findFirst({
            where: { id: paymentId, tenantId },
            include: {
                invoice: true,
            },
        });
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found');
        }
        if (payment.status !== 'COMPLETED') {
            throw new errors_1.ValidationError('Only completed payments can be refunded');
        }
        const refundAmount = amount || payment.amount.toNumber();
        if (refundAmount > payment.amount.toNumber()) {
            throw new errors_1.ValidationError('Refund amount cannot exceed payment amount');
        }
        const updatedPayment = await prisma_1.prisma.$transaction(async (tx) => {
            const updated = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: refundAmount === payment.amount.toNumber() ? 'REFUNDED' : 'COMPLETED',
                },
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    invoice: {
                        select: {
                            id: true,
                            number: true,
                            total: true,
                            status: true,
                        },
                    },
                },
            });
            if (payment.invoice && refundAmount === payment.amount.toNumber()) {
                await tx.invoice.update({
                    where: { id: payment.invoiceId },
                    data: {
                        status: 'SENT',
                        paidAt: null,
                    },
                });
            }
            return updated;
        });
        return updatedPayment;
    }
    async getPaymentStats(tenantId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const [totalPayments, totalAmount, methodStats, statusStats, monthlyPayments, weeklyPayments, recentPayments,] = await Promise.all([
            prisma_1.prisma.payment.count({ where: { tenantId } }),
            prisma_1.prisma.payment.aggregate({
                where: { tenantId },
                _sum: { amount: true },
            }),
            prisma_1.prisma.payment.groupBy({
                by: ['method'],
                where: { tenantId },
                _count: { method: true },
                _sum: { amount: true },
            }),
            prisma_1.prisma.payment.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: { status: true },
                _sum: { amount: true },
            }),
            prisma_1.prisma.payment.aggregate({
                where: { tenantId, createdAt: { gte: startOfMonth } },
                _count: true,
                _sum: { amount: true },
            }),
            prisma_1.prisma.payment.aggregate({
                where: { tenantId, createdAt: { gte: startOfWeek } },
                _count: true,
                _sum: { amount: true },
            }),
            prisma_1.prisma.payment.findMany({
                where: { tenantId },
                include: {
                    client: {
                        select: { name: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        const totalAmountValue = totalAmount._sum.amount?.toNumber() || 0;
        const byMethod = methodStats.map(({ method, _count, _sum }) => ({
            method,
            count: _count.method,
            amount: _sum.amount?.toNumber() || 0,
            percentage: totalPayments > 0 ? (_count.method / totalPayments) * 100 : 0,
        }));
        const byStatus = statusStats.map(({ status, _count, _sum }) => ({
            status,
            count: _count.status,
            amount: _sum.amount?.toNumber() || 0,
            percentage: totalPayments > 0 ? (_count.status / totalPayments) * 100 : 0,
        }));
        return {
            totalPayments,
            totalAmount: totalAmountValue,
            byMethod,
            byStatus,
            thisMonth: {
                count: monthlyPayments._count,
                amount: monthlyPayments._sum.amount?.toNumber() || 0,
            },
            thisWeek: {
                count: weeklyPayments._count,
                amount: weeklyPayments._sum.amount?.toNumber() || 0,
            },
            recentPayments: recentPayments.map(p => ({
                id: p.id,
                amount: p.amount.toNumber(),
                method: p.method,
                status: p.status,
                clientName: p.client.name,
                createdAt: p.createdAt,
            })),
        };
    }
    async cancelPayment(tenantId, paymentId) {
        const payment = await prisma_1.prisma.payment.findFirst({
            where: { id: paymentId, tenantId },
        });
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found');
        }
        if (payment.status !== 'PENDING') {
            throw new errors_1.ValidationError('Only pending payments can be cancelled');
        }
        const updatedPayment = await prisma_1.prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'CANCELLED' },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invoice: {
                    select: {
                        id: true,
                        number: true,
                        total: true,
                        status: true,
                    },
                },
            },
        });
        return updatedPayment;
    }
    async retryPayment(tenantId, paymentId) {
        const payment = await prisma_1.prisma.payment.findFirst({
            where: { id: paymentId, tenantId },
        });
        if (!payment) {
            throw new errors_1.NotFoundError('Payment not found');
        }
        if (payment.status !== 'FAILED') {
            throw new errors_1.ValidationError('Only failed payments can be retried');
        }
        const updatedPayment = await prisma_1.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'PENDING',
                processedAt: null,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                invoice: {
                    select: {
                        id: true,
                        number: true,
                        total: true,
                        status: true,
                    },
                },
            },
        });
        return updatedPayment;
    }
    async getClientPayments(tenantId, clientId) {
        const payments = await prisma_1.prisma.payment.findMany({
            where: { tenantId, clientId },
            include: {
                invoice: {
                    select: {
                        id: true,
                        number: true,
                        total: true,
                        status: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return payments;
    }
    async getInvoicePayments(tenantId, invoiceId) {
        const payments = await prisma_1.prisma.payment.findMany({
            where: { tenantId, invoiceId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return payments;
    }
}
exports.paymentService = new PaymentService();
//# sourceMappingURL=paymentService.js.map