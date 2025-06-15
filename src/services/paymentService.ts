import { PrismaClient, Payment, PaymentMethod, PaymentStatus, Invoice } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

interface CreatePaymentData {
  clientId: string;
  invoiceId?: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  reference?: string;
  metadata?: Record<string, any>;
}

interface ProcessPaymentData {
  paymentIntentId?: string;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
}

interface PaymentQuery {
  page: number;
  limit: number;
  clientId?: string;
  invoiceId?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  byMethod: Array<{
    method: PaymentMethod;
    count: number;
    amount: number;
    percentage: number;
  }>;
  byStatus: Array<{
    status: PaymentStatus;
    count: number;
    amount: number;
    percentage: number;
  }>;
  thisMonth: {
    count: number;
    amount: number;
  };
  thisWeek: {
    count: number;
    amount: number;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    clientName: string;
    createdAt: Date;
  }>;
}

interface PaymentWithRelations extends Payment {
  client: {
    id: string;
    name: string;
    email: string;
  };
  invoice?: {
    id: string;
    number: string;
    total: number;
    status: string;
  };
}

class PaymentService {
  async createPayment(tenantId: string, data: CreatePaymentData): Promise<Payment> {
    // Validate client exists
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // Validate invoice if provided
    if (data.invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: data.invoiceId, tenantId, clientId: data.clientId },
      });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      // Check if invoice is already paid
      if (invoice.status === 'PAID') {
        throw new ValidationError('Invoice is already paid');
      }
    }

    const payment = await prisma.payment.create({
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

  async processPayment(tenantId: string, paymentId: string, data: ProcessPaymentData): Promise<Payment> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      throw new ValidationError('Payment is not in pending status');
    }

    // Simulate payment processing based on method
    let status: PaymentStatus = 'COMPLETED';
    let processedAt = new Date();

    // In a real implementation, this would integrate with payment gateways
    switch (payment.method) {
      case 'STRIPE':
        // Simulate Stripe processing
        status = Math.random() > 0.1 ? 'COMPLETED' : 'FAILED';
        break;
      case 'PAYPAL':
        // Simulate PayPal processing
        status = Math.random() > 0.05 ? 'COMPLETED' : 'FAILED';
        break;
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        // Simulate card processing
        status = Math.random() > 0.08 ? 'COMPLETED' : 'FAILED';
        break;
      case 'BANK_TRANSFER':
        // Bank transfers might be pending longer
        status = Math.random() > 0.5 ? 'COMPLETED' : 'PENDING';
        break;
      case 'CASH':
        // Cash payments are immediately completed
        status = 'COMPLETED';
        break;
      default:
        status = 'COMPLETED';
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      // Update payment status
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

      // If payment is completed and has an invoice, update invoice status
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
            where: { id: payment.invoiceId! },
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

  async getPayments(tenantId: string, query: PaymentQuery): Promise<{
    payments: PaymentWithRelations[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page,
      limit,
      clientId,
      invoiceId,
      method,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = query;
    const offset = (page - 1) * limit;

    const where: any = { tenantId };

    if (clientId) where.clientId = clientId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (method) where.method = method;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
      prisma.payment.count({ where }),
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

  async getPaymentById(tenantId: string, paymentId: string): Promise<PaymentWithRelations> {
    const payment = await prisma.payment.findFirst({
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
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  async refundPayment(tenantId: string, paymentId: string, amount?: number): Promise<Payment> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new ValidationError('Only completed payments can be refunded');
    }

    const refundAmount = amount || payment.amount.toNumber();
    if (refundAmount > payment.amount.toNumber()) {
      throw new ValidationError('Refund amount cannot exceed payment amount');
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: refundAmount === payment.amount.toNumber() ? 'REFUNDED' : 'COMPLETED',
          // In a real implementation, you'd track partial refunds differently
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

      // If payment had an invoice, update invoice status
      if (payment.invoice && refundAmount === payment.amount.toNumber()) {
        await tx.invoice.update({
          where: { id: payment.invoiceId! },
          data: {
            status: 'SENT', // Reset to sent status
            paidAt: null,
          },
        });
      }

      return updated;
    });

    return updatedPayment;
  }

  async getPaymentStats(tenantId: string): Promise<PaymentStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [
      totalPayments,
      totalAmount,
      methodStats,
      statusStats,
      monthlyPayments,
      weeklyPayments,
      recentPayments,
    ] = await Promise.all([
      prisma.payment.count({ where: { tenantId } }),
      prisma.payment.aggregate({
        where: { tenantId },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: { tenantId },
        _count: { method: true },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { tenantId, createdAt: { gte: startOfMonth } },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { tenantId, createdAt: { gte: startOfWeek } },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
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

  async cancelPayment(tenantId: string, paymentId: string): Promise<Payment> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      throw new ValidationError('Only pending payments can be cancelled');
    }

    const updatedPayment = await prisma.payment.update({
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

  async retryPayment(tenantId: string, paymentId: string): Promise<Payment> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== 'FAILED') {
      throw new ValidationError('Only failed payments can be retried');
    }

    const updatedPayment = await prisma.payment.update({
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

  async getClientPayments(tenantId: string, clientId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
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

  async getInvoicePayments(tenantId: string, invoiceId: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
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

export const paymentService = new PaymentService();