'use server'

import { requireAuth, requireAdmin, withTenantContext, getTenantPrisma } from '../server/tenant-context'
import { validateData } from '../validations'
import { 
  createPaymentSchema, 
  updatePaymentSchema, 
  paymentFiltersSchema,
  processPaymentSchema,
  refundPaymentSchema,
  bulkPaymentActionSchema,
  createReconciliationSchema,
  matchPaymentSchema,
  paymentStatsFiltersSchema,
  createPaymentPlanSchema,
  createSubscriptionSchema,
  type CreatePaymentRequest,
  type UpdatePaymentRequest,
  type PaymentFilters,
  type ProcessPaymentRequest,
  type RefundPaymentRequest,
  type BulkPaymentActionRequest,
  type CreateReconciliationRequest,
  type MatchPaymentRequest,
  type PaymentStatsFilters,
  type CreatePaymentPlanRequest,
  type CreateSubscriptionRequest
} from '../validations/payment'
import { ActionResult } from '@/types/database'
import { QueryBuilder } from '../utils/search'

/**
 * Payment CRUD Operations
 */

export async function createPaymentAction(data: CreatePaymentRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(createPaymentSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication and permissions
    await requireAuth()
    await requireAdmin()
    
    const validatedData = validation.data
    const prisma = await getTenantPrisma()

    // If invoice is specified, validate it exists and belongs to the client
    if (validatedData.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: validatedData.invoiceId },
        select: { id: true, clientId: true, total: true, status: true },
      })

      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found',
        }
      }

      if (invoice.clientId !== validatedData.clientId) {
        return {
          success: false,
          error: 'Invoice does not belong to the specified client',
        }
      }

      if (invoice.status === 'CANCELLED') {
        return {
          success: false,
          error: 'Cannot create payment for cancelled invoice',
        }
      }
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        clientId: validatedData.clientId,
        invoiceId: validatedData.invoiceId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        method: validatedData.method,
        reference: validatedData.reference,
        status: 'PENDING',
        processedAt: validatedData.processedAt,
        // metadata will be stored as JSON
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
    })

    return {
      success: true,
      data: payment,
    }

  } catch (error: any) {
    console.error('Payment creation error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to create payment',
    }
  }
}

export async function getPaymentAction(id: string): Promise<ActionResult<any>> {
  try {
    // Check authentication
    await requireAuth()
    
    const prisma = await getTenantPrisma()

    const payment = await prisma.payment.findUnique({
      where: { id },
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
            title: true,
            total: true,
            status: true,
            dueDate: true,
          },
        },
        reconciliationItems: {
          include: {
            reconciliation: {
              select: {
                id: true,
                status: true,
                reconciledAt: true,
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
      }
    }

    return {
      success: true,
      data: payment,
    }

  } catch (error: any) {
    console.error('Payment retrieval error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to retrieve payment',
    }
  }
}

export async function updatePaymentAction(id: string, data: UpdatePaymentRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(updatePaymentSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication and permissions
    await requireAuth()
    await requireAdmin()
    
    const validatedData = validation.data
    const prisma = await getTenantPrisma()

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: { invoice: true },
    })

    if (!existingPayment) {
      return {
        success: false,
        error: 'Payment not found',
      }
    }

    // Check if payment can be modified
    if (existingPayment.status === 'COMPLETED' && validatedData.status !== 'COMPLETED') {
      return {
        success: false,
        error: 'Cannot modify completed payment status',
      }
    }

    if (existingPayment.status === 'REFUNDED') {
      return {
        success: false,
        error: 'Cannot modify refunded payment',
      }
    }

    // Update payment
    const payment = await prisma.payment.update({
      where: { id },
      data: validatedData,
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
    })

    // If payment is being marked as completed and has an invoice,
    // check if invoice should be marked as paid
    if (validatedData.status === 'COMPLETED' && payment.invoice) {
      const invoice = payment.invoice
      const totalPaid = await prisma.payment.aggregate({
        where: {
          invoiceId: invoice.id,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      })

      const paidAmount = Number(totalPaid._sum.amount || 0)
      const invoiceTotal = Number(invoice.total)

      if (paidAmount >= invoiceTotal && invoice.status !== 'PAID') {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })
      }
    }

    return {
      success: true,
      data: payment,
    }

  } catch (error: any) {
    console.error('Payment update error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to update payment',
    }
  }
}

export async function listPaymentsAction(filters: PaymentFilters): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(paymentFiltersSchema, filters)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication
    await requireAuth()
    
    const validatedFilters = validation.data
    const { page, limit, sortBy, sortOrder, ...searchFilters } = validatedFilters

    const prisma = await getTenantPrisma()

    // Build query
    const queryBuilder = new QueryBuilder()

    // Add search filters
    if (searchFilters.search) {
      queryBuilder.addSearch(searchFilters.search, {
        fields: ['reference', 'description'],
      })
    }

    if (searchFilters.clientId) {
      queryBuilder.addFilter('clientId', searchFilters.clientId)
    }

    if (searchFilters.invoiceId) {
      queryBuilder.addFilter('invoiceId', searchFilters.invoiceId)
    }

    if (searchFilters.method) {
      queryBuilder.addFilter('method', searchFilters.method)
    }

    if (searchFilters.status) {
      queryBuilder.addFilter('status', searchFilters.status)
    }

    if (searchFilters.startDate) {
      queryBuilder.addFilter('createdAt', { gte: searchFilters.startDate })
    }

    if (searchFilters.endDate) {
      queryBuilder.addFilter('createdAt', { lte: searchFilters.endDate })
    }

    if (searchFilters.minAmount) {
      queryBuilder.addFilter('amount', { gte: searchFilters.minAmount })
    }

    if (searchFilters.maxAmount) {
      queryBuilder.addFilter('amount', { lte: searchFilters.maxAmount })
    }

    if (searchFilters.currency) {
      queryBuilder.addFilter('currency', searchFilters.currency)
    }

    if (searchFilters.hasInvoice !== undefined) {
      if (searchFilters.hasInvoice) {
        queryBuilder.addFilter('invoiceId', { not: null })
      } else {
        queryBuilder.addFilter('invoiceId', null)
      }
    }

    const { where, orderBy } = queryBuilder
      .addSort(sortBy, sortOrder)
      .build()

    // Get total count
    const totalCount = await prisma.payment.count({ where })

    // Get payments
    const payments = await prisma.payment.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
            title: true,
            total: true,
            status: true,
          },
        },
      },
    })

    return {
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      },
    }

  } catch (error: any) {
    console.error('Payment listing error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to retrieve payments',
    }
  }
}

/**
 * Payment Processing Operations
 */

export async function processPaymentAction(data: ProcessPaymentRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(processPaymentSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication and permissions
    await requireAuth()
    await requireAdmin()
    
    const validatedData = validation.data
    const prisma = await getTenantPrisma()

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: validatedData.paymentId },
      include: { invoice: true },
    })

    if (!existingPayment) {
      return {
        success: false,
        error: 'Payment not found',
      }
    }

    // Check if payment can be processed
    if (existingPayment.status !== 'PENDING') {
      return {
        success: false,
        error: 'Only pending payments can be processed',
      }
    }

    // Update payment status
    const payment = await prisma.payment.update({
      where: { id: validatedData.paymentId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        reference: validatedData.transactionId || existingPayment.reference,
        // Store processor response in metadata
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
    })

    // If payment has an invoice, check if it should be marked as paid
    if (payment.invoice) {
      const totalPaid = await prisma.payment.aggregate({
        where: {
          invoiceId: payment.invoice.id,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      })

      const paidAmount = Number(totalPaid._sum.amount || 0)
      const invoiceTotal = Number(payment.invoice.total)

      if (paidAmount >= invoiceTotal && payment.invoice.status !== 'PAID') {
        await prisma.invoice.update({
          where: { id: payment.invoice.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })
      }
    }

    return {
      success: true,
      data: payment,
    }

  } catch (error: any) {
    console.error('Payment processing error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to process payment',
    }
  }
}

export async function refundPaymentAction(data: RefundPaymentRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(refundPaymentSchema, data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication and permissions
    await requireAuth()
    await requireAdmin()
    
    const validatedData = validation.data
    const prisma = await getTenantPrisma()

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: validatedData.paymentId },
      include: { invoice: true, client: true },
    })

    if (!existingPayment) {
      return {
        success: false,
        error: 'Payment not found',
      }
    }

    // Check if payment can be refunded
    if (existingPayment.status !== 'COMPLETED') {
      return {
        success: false,
        error: 'Only completed payments can be refunded',
      }
    }

    const refundAmount = validatedData.refundAmount || Number(existingPayment.amount)

    if (refundAmount > Number(existingPayment.amount)) {
      return {
        success: false,
        error: 'Refund amount cannot exceed original payment amount',
      }
    }

    // Create refund payment record
    const refundPayment = await prisma.payment.create({
      data: {
        clientId: existingPayment.clientId,
        invoiceId: existingPayment.invoiceId,
        amount: -refundAmount, // Negative amount for refund
        currency: existingPayment.currency,
        method: existingPayment.method,
        reference: validatedData.refundReference || `REFUND-${existingPayment.reference}`,
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    })

    // Update original payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: validatedData.paymentId },
      data: { status: 'REFUNDED' },
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
    })

    // If payment had an invoice, recalculate invoice status
    if (existingPayment.invoice) {
      const totalPaid = await prisma.payment.aggregate({
        where: {
          invoiceId: existingPayment.invoice.id,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      })

      const paidAmount = Number(totalPaid._sum.amount || 0)
      const invoiceTotal = Number(existingPayment.invoice.total)

      if (paidAmount < invoiceTotal && existingPayment.invoice.status === 'PAID') {
        await prisma.invoice.update({
          where: { id: existingPayment.invoice.id },
          data: {
            status: 'SENT',
            paidAt: null,
          },
        })
      }
    }

    return {
      success: true,
      data: {
        originalPayment: updatedPayment,
        refundPayment,
        refundAmount,
        reason: validatedData.reason,
      },
    }

  } catch (error: any) {
    console.error('Payment refund error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to refund payment',
    }
  }
}

/**
 * Payment Statistics
 */

export async function getPaymentStatsAction(filters: PaymentStatsFilters = {}): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(paymentStatsFiltersSchema, filters)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.errors.reduce((acc, err) => {
          acc[err.field] = err.message
          return acc
        }, {} as Record<string, string>),
      }
    }

    // Check authentication
    await requireAuth()
    
    const validatedFilters = validation.data
    const prisma = await getTenantPrisma()

    // Build filters
    const whereClause: any = {}

    if (validatedFilters.clientIds && validatedFilters.clientIds.length > 0) {
      whereClause.clientId = { in: validatedFilters.clientIds }
    }

    if (validatedFilters.status && validatedFilters.status.length > 0) {
      whereClause.status = { in: validatedFilters.status }
    }

    if (validatedFilters.methods && validatedFilters.methods.length > 0) {
      whereClause.method = { in: validatedFilters.methods }
    }

    if (validatedFilters.currency && validatedFilters.currency.length > 0) {
      whereClause.currency = { in: validatedFilters.currency }
    }

    if (validatedFilters.dateFrom) {
      whereClause.createdAt = { ...whereClause.createdAt, gte: validatedFilters.dateFrom }
    }

    if (validatedFilters.dateTo) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: validatedFilters.dateTo }
    }

    const stats: any = {}

    // Basic statistics
    const totalPayments = await prisma.payment.count({ where: whereClause })
    
    const paymentsByStatus = await prisma.payment.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
      _sum: { amount: true },
    })

    stats.overview = {
      totalPayments,
      byStatus: paymentsByStatus.reduce((acc, item) => {
        acc[item.status] = {
          count: item._count,
          totalAmount: item._sum.amount || 0,
        }
        return acc
      }, {} as Record<string, any>),
    }

    // Method breakdown
    if (validatedFilters.includeMethodBreakdown) {
      const paymentsByMethod = await prisma.payment.groupBy({
        by: ['method'],
        where: {
          ...whereClause,
          status: 'COMPLETED',
        },
        _count: true,
        _sum: { amount: true },
        _avg: { amount: true },
      })

      stats.methodBreakdown = paymentsByMethod.map(item => ({
        method: item.method,
        count: item._count,
        totalAmount: item._sum.amount || 0,
        averageAmount: item._avg.amount || 0,
      }))
    }

    // Revenue analysis
    const completedPayments = await prisma.payment.aggregate({
      where: {
        ...whereClause,
        status: 'COMPLETED',
        amount: { gt: 0 }, // Exclude refunds
      },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: true,
    })

    stats.revenue = {
      totalRevenue: completedPayments._sum.amount || 0,
      averagePayment: completedPayments._avg.amount || 0,
      paymentCount: completedPayments._count,
    }

    // Refunds analysis
    if (validatedFilters.includeRefunds) {
      const refunds = await prisma.payment.aggregate({
        where: {
          ...whereClause,
          amount: { lt: 0 }, // Negative amounts are refunds
        },
        _sum: { amount: true },
        _count: true,
      })

      stats.refunds = {
        totalRefunded: Math.abs(Number(refunds._sum.amount || 0)),
        refundCount: refunds._count,
        refundRate: completedPayments._count > 0 
          ? (refunds._count / completedPayments._count) * 100 
          : 0,
      }
    }

    return {
      success: true,
      data: stats,
    }

  } catch (error: any) {
    console.error('Payment stats error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to retrieve payment statistics',
    }
  }
}