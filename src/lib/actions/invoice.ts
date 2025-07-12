'use server'

import { requireAuth, requireAdmin, withTenantContext, getTenantPrisma } from '../server/tenant-context'
import { validateData } from '../validations'
import { 
  createInvoiceSchema, 
  updateInvoiceSchema, 
  invoiceFiltersSchema,
  sendInvoiceSchema,
  markInvoicePaidSchema,
  bulkInvoiceActionSchema,
  invoiceStatsFiltersSchema,
  createRecurringInvoiceSchema,
  type CreateInvoiceRequest,
  type UpdateInvoiceRequest,
  type InvoiceFilters,
  type SendInvoiceRequest,
  type MarkInvoicePaidRequest,
  type BulkInvoiceActionRequest,
  type InvoiceStatsFilters,
  type CreateRecurringInvoiceRequest
} from '../validations/invoice'
import { ActionResult } from '@/types/database'
import { QueryBuilder } from '../utils/search'

/**
 * Invoice CRUD Operations
 */

export async function createInvoiceAction(data: CreateInvoiceRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(createInvoiceSchema, data)
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

    // Generate invoice number if not provided
    let invoiceNumber = validatedData.number
    if (!invoiceNumber) {
      const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { number: true },
      })
      
      const lastNumber = lastInvoice?.number 
        ? parseInt(lastInvoice.number.replace(/[^\d]/g, '')) || 0
        : 0
      
      invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`
    }

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice
      return sum + itemTotal
    }, 0)

    const tax = validatedData.tax || 0
    const total = subtotal + tax

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        clientId: validatedData.clientId,
        number: invoiceNumber,
        title: validatedData.title,
        description: validatedData.description,
        subtotal,
        tax,
        total,
        currency: validatedData.currency,
        dueDate: validatedData.dueDate,
        createdById: (await requireAuth()).id,
        items: {
          create: validatedData.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: invoice,
    }

  } catch (error: any) {
    console.error('Invoice creation error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    if (error.code === 'P2002' && error.meta?.target?.includes('number')) {
      return {
        success: false,
        error: 'Invoice number already exists',
      }
    }

    return {
      success: false,
      error: 'Failed to create invoice',
    }
  }
}

export async function getInvoiceAction(id: string): Promise<ActionResult<any>> {
  try {
    // Check authentication
    await requireAuth()
    
    const prisma = await getTenantPrisma()

    const invoice = await prisma.invoice.findUnique({
      where: { id },
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
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          where: { status: { notIn: ['CANCELLED', 'FAILED'] } },
          orderBy: { createdAt: 'desc' },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    return {
      success: true,
      data: invoice,
    }

  } catch (error: any) {
    console.error('Invoice retrieval error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to retrieve invoice',
    }
  }
}

export async function updateInvoiceAction(id: string, data: UpdateInvoiceRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(updateInvoiceSchema, data)
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

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingInvoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    // Check if invoice can be modified
    if (existingInvoice.status === 'PAID') {
      return {
        success: false,
        error: 'Cannot modify paid invoice',
      }
    }

    // Prepare update data
    const updateData: any = {
      title: validatedData.title,
      description: validatedData.description,
      dueDate: validatedData.dueDate,
      tax: validatedData.tax,
      status: validatedData.status,
    }

    // If items are being updated, recalculate totals
    if (validatedData.items) {
      const subtotal = validatedData.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)

      const tax = validatedData.tax || existingInvoice.tax
      const total = subtotal + Number(tax)

      updateData.subtotal = subtotal
      updateData.total = total

      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      })
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Create new items if provided
    if (validatedData.items) {
      await prisma.invoiceItem.createMany({
        data: validatedData.items.map(item => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      })

      // Fetch updated invoice with new items
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      return {
        success: true,
        data: updatedInvoice,
      }
    }

    return {
      success: true,
      data: invoice,
    }

  } catch (error: any) {
    console.error('Invoice update error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to update invoice',
    }
  }
}

export async function deleteInvoiceAction(id: string): Promise<ActionResult<void>> {
  try {
    // Check authentication and permissions
    await requireAuth()
    await requireAdmin()
    
    const prisma = await getTenantPrisma()

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: {
          where: { status: { notIn: ['CANCELLED', 'FAILED'] } },
        },
      },
    })

    if (!existingInvoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    // Check if invoice can be deleted
    if (existingInvoice.status === 'PAID') {
      return {
        success: false,
        error: 'Cannot delete paid invoice',
      }
    }

    if (existingInvoice.payments.length > 0) {
      return {
        success: false,
        error: 'Cannot delete invoice with associated payments',
      }
    }

    // Delete invoice (items will be deleted cascade)
    await prisma.invoice.delete({
      where: { id },
    })

    return {
      success: true,
    }

  } catch (error: any) {
    console.error('Invoice deletion error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to delete invoice',
    }
  }
}

export async function listInvoicesAction(filters: InvoiceFilters): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(invoiceFiltersSchema, filters)
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
        fields: ['number', 'title', 'description'],
      })
    }

    if (searchFilters.clientId) {
      queryBuilder.addFilter('clientId', searchFilters.clientId)
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
      queryBuilder.addFilter('total', { gte: searchFilters.minAmount })
    }

    if (searchFilters.maxAmount) {
      queryBuilder.addFilter('total', { lte: searchFilters.maxAmount })
    }

    if (searchFilters.currency) {
      queryBuilder.addFilter('currency', searchFilters.currency)
    }

    if (searchFilters.overdue) {
      const now = new Date()
      queryBuilder.addFilter('dueDate', { lt: now })
      queryBuilder.addFilter('status', { notIn: ['PAID', 'CANCELLED'] })
    }

    if (searchFilters.unpaid) {
      queryBuilder.addFilter('status', { notIn: ['PAID'] })
    }

    const { where, orderBy } = queryBuilder
      .addSort(sortBy, sortOrder)
      .build()

    // Get total count
    const totalCount = await prisma.invoice.count({ where })

    // Get invoices
    const invoices = await prisma.invoice.findMany({
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
        _count: {
          select: {
            items: true,
            payments: {
              where: { status: { notIn: ['CANCELLED', 'FAILED'] } },
            },
          },
        },
      },
    })

    return {
      success: true,
      data: {
        invoices,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      },
    }

  } catch (error: any) {
    console.error('Invoice listing error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to retrieve invoices',
    }
  }
}

/**
 * Invoice Operations
 */

export async function sendInvoiceAction(data: SendInvoiceRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(sendInvoiceSchema, data)
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

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: validatedData.invoiceId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    // Check if invoice can be sent
    if (invoice.status === 'PAID') {
      return {
        success: false,
        error: 'Cannot send paid invoice',
      }
    }

    if (invoice.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Cannot send cancelled invoice',
      }
    }

    // Update invoice status to SENT
    const updatedInvoice = await prisma.invoice.update({
      where: { id: validatedData.invoiceId },
      data: { status: 'SENT' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    })

    // TODO: Implement email sending logic here
    // This would integrate with your email service (SendGrid, etc.)

    return {
      success: true,
      data: {
        invoice: updatedInvoice,
        sent: validatedData.sendEmail,
        message: 'Invoice sent successfully',
      },
    }

  } catch (error: any) {
    console.error('Invoice send error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to send invoice',
    }
  }
}

export async function markInvoicePaidAction(data: MarkInvoicePaidRequest): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(markInvoicePaidSchema, data)
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

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: validatedData.invoiceId },
    })

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    // Check if invoice can be marked as paid
    if (invoice.status === 'PAID') {
      return {
        success: false,
        error: 'Invoice is already paid',
      }
    }

    if (invoice.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Cannot mark cancelled invoice as paid',
      }
    }

    const paidAmount = validatedData.paidAmount || Number(invoice.total)
    const paidAt = validatedData.paidAt || new Date()

    // Create payment record
    await prisma.payment.create({
      data: {
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        amount: paidAmount,
        currency: invoice.currency,
        method: validatedData.paymentMethod,
        reference: validatedData.paymentReference,
        status: 'COMPLETED',
        processedAt: paidAt,
      },
    })

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: validatedData.invoiceId },
      data: {
        status: 'PAID',
        paidAt,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
        payments: true,
      },
    })

    return {
      success: true,
      data: updatedInvoice,
    }

  } catch (error: any) {
    console.error('Mark invoice paid error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to mark invoice as paid',
    }
  }
}

/**
 * Invoice Statistics
 */

export async function getInvoiceStatsAction(filters: InvoiceStatsFilters = {}): Promise<ActionResult<any>> {
  try {
    // Validate input
    const validation = validateData(invoiceStatsFiltersSchema, filters)
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
    const totalInvoices = await prisma.invoice.count({ where: whereClause })
    
    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
      _sum: { total: true },
    })

    stats.overview = {
      totalInvoices,
      byStatus: invoicesByStatus.reduce((acc, item) => {
        acc[item.status] = {
          count: item._count,
          totalAmount: item._sum.total || 0,
        }
        return acc
      }, {} as Record<string, any>),
    }

    // Revenue statistics
    if (validatedFilters.includeRevenue) {
      const revenueStats = await prisma.invoice.aggregate({
        where: {
          ...whereClause,
          status: { in: ['PAID', 'SENT'] },
        },
        _sum: { total: true, subtotal: true, tax: true },
        _avg: { total: true },
        _count: true,
      })

      stats.revenue = {
        totalRevenue: revenueStats._sum.total || 0,
        totalSubtotal: revenueStats._sum.subtotal || 0,
        totalTax: revenueStats._sum.tax || 0,
        averageInvoiceValue: revenueStats._avg.total || 0,
        invoiceCount: revenueStats._count,
      }
    }

    // Overdue analysis
    if (validatedFilters.includeOverdue) {
      const now = new Date()
      const overdueInvoices = await prisma.invoice.aggregate({
        where: {
          ...whereClause,
          dueDate: { lt: now },
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
        _sum: { total: true },
        _count: true,
      })

      stats.overdue = {
        count: overdueInvoices._count,
        totalAmount: overdueInvoices._sum.total || 0,
      }
    }

    // Collections analysis
    if (validatedFilters.includeCollections) {
      const paidInvoices = await prisma.invoice.findMany({
        where: {
          ...whereClause,
          status: 'PAID',
          paidAt: { not: null },
        },
        select: {
          total: true,
          dueDate: true,
          paidAt: true,
        },
      })

      const collectionMetrics = paidInvoices.reduce(
        (acc, invoice) => {
          const daysToPay = invoice.paidAt 
            ? Math.floor((invoice.paidAt.getTime() - invoice.dueDate.getTime()) / (24 * 60 * 60 * 1000))
            : 0

          acc.totalDays += Math.abs(daysToPay)
          acc.onTime += daysToPay <= 0 ? 1 : 0
          acc.late += daysToPay > 0 ? 1 : 0
          acc.count += 1

          return acc
        },
        { totalDays: 0, onTime: 0, late: 0, count: 0 }
      )

      stats.collections = {
        onTimeRate: collectionMetrics.count > 0 ? (collectionMetrics.onTime / collectionMetrics.count) * 100 : 0,
        averageDaysToPayment: collectionMetrics.count > 0 ? collectionMetrics.totalDays / collectionMetrics.count : 0,
        onTimeCount: collectionMetrics.onTime,
        lateCount: collectionMetrics.late,
      }
    }

    return {
      success: true,
      data: stats,
    }

  } catch (error: any) {
    console.error('Invoice stats error:', error)
    
    if (error.message.includes('Authentication required')) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    return {
      success: false,
      error: 'Failed to retrieve invoice statistics',
    }
  }
}