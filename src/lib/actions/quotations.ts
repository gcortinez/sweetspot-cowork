'use server'

import { revalidatePath } from 'next/cache'
import { getTenantContext } from '@/lib/auth'
import { db } from '@/lib/db'
import type { ActionResult } from '@/types/database'
import {
  CreateQuotationSchema,
  UpdateQuotationSchema,
  DeleteQuotationSchema,
  GetQuotationSchema,
  ListQuotationsSchema,
  ChangeQuotationStatusSchema,
  DuplicateQuotationSchema,
  GetQuotationStatsSchema,
  SendQuotationSchema,
  ConvertQuotationToContractSchema,
  AddServiceToQuotationSchema,
  RemoveServiceFromQuotationSchema,
  UpdateQuotationItemSchema,
  ApplyDiscountToQuotationSchema,
  generateQuotationNumber,
  generateQuotationVersion,
  calculateQuotationTotals,
  validateQuotationItems,
  type CreateQuotationRequest,
  type UpdateQuotationRequest,
  type DeleteQuotationRequest,
  type GetQuotationRequest,
  type ListQuotationsRequest,
  type ChangeQuotationStatusRequest,
  type DuplicateQuotationRequest,
  type GetQuotationStatsRequest,
  type SendQuotationRequest,
  type ConvertQuotationToContractRequest,
  type AddServiceToQuotationRequest,
  type RemoveServiceFromQuotationRequest,
  type UpdateQuotationItemRequest,
  type ApplyDiscountToQuotationRequest,
} from '@/lib/validations/quotations'

// Helper function to get user with tenant info
async function getUserWithTenant() {
  const context = await getTenantContext()
  return { user: context.user, tenantId: context.tenantId }
}

// Helper function to serialize quotation data
function serializeQuotation(quotation: any) {
  // Helper function to safely convert Decimal to number
  const toNumber = (value: any) => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') return parseFloat(value) || 0
    // Handle Prisma Decimal objects
    if (value && typeof value.toNumber === 'function') return value.toNumber()
    if (value && typeof value.toString === 'function') return parseFloat(value.toString()) || 0
    return Number(value) || 0
  }

  return {
    ...quotation,
    subtotal: toNumber(quotation.subtotal),
    discounts: toNumber(quotation.discounts),
    taxes: toNumber(quotation.taxes),
    total: toNumber(quotation.total),
    validUntil: quotation.validUntil ? quotation.validUntil.toISOString() : null,
    createdAt: quotation.createdAt ? quotation.createdAt.toISOString() : null,
    updatedAt: quotation.updatedAt ? quotation.updatedAt.toISOString() : null,
    approvedAt: quotation.approvedAt ? quotation.approvedAt.toISOString() : null,
    items: quotation.items?.map((item: any) => ({
      ...item,
      unitPrice: toNumber(item.unitPrice),
      total: toNumber(item.total),
      createdAt: item.createdAt ? item.createdAt.toISOString() : null,
    })) || [],
    // Handle nested objects with potential Decimal values
    opportunity: quotation.opportunity ? {
      ...quotation.opportunity,
      value: toNumber(quotation.opportunity.value),
      expectedRevenue: toNumber(quotation.opportunity.expectedRevenue),
    } : null,
    client: quotation.client ? {
      ...quotation.client,
      createdAt: quotation.client.createdAt ? quotation.client.createdAt.toISOString() : null,
      updatedAt: quotation.client.updatedAt ? quotation.client.updatedAt.toISOString() : null,
    } : null,
    lead: quotation.lead ? {
      ...quotation.lead,
      budget: toNumber(quotation.lead.budget),
      createdAt: quotation.lead.createdAt ? quotation.lead.createdAt.toISOString() : null,
      updatedAt: quotation.lead.updatedAt ? quotation.lead.updatedAt.toISOString() : null,
    } : null,
  }
}

// Helper function to serialize quotation stats
function serializeQuotationStats(stats: any) {
  return {
    ...stats,
    totalValue: stats.totalValue ? Number(stats.totalValue) : 0,
    averageValue: stats.averageValue ? Number(stats.averageValue) : 0,
    totalValueByStatus: stats.totalValueByStatus ? 
      Object.fromEntries(
        Object.entries(stats.totalValueByStatus).map(([key, value]) => [key, Number(value)])
      ) : {},
  }
}

/**
 * Create a new quotation
 */
export async function createQuotationAction(data: CreateQuotationRequest): Promise<ActionResult<any>> {
  try {
    const { user, tenantId } = await getUserWithTenant()
    
    if (!tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }

    // Validate input data
    const validatedData = CreateQuotationSchema.parse(data)

    // Validate quotation items
    if (!validateQuotationItems(validatedData.items)) {
      return { success: false, error: 'Los totales de los items no son válidos' }
    }

    // Calculate totals
    const { subtotal, total } = calculateQuotationTotals(
      validatedData.items,
      validatedData.discounts,
      validatedData.taxes
    )

    // Get next quotation number
    const lastQuotation = await db.quotation.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    const nextSequence = lastQuotation ? 
      parseInt(lastQuotation.number.split('-')[2]) + 1 : 1
    
    const quotationNumber = generateQuotationNumber(tenantId, nextSequence)

    // Create quotation with items
    const quotation = await db.quotation.create({
      data: {
        tenantId,
        clientId: validatedData.clientId,
        opportunityId: validatedData.opportunityId,
        leadId: validatedData.leadId,
        number: quotationNumber,
        title: validatedData.title,
        description: validatedData.description,
        subtotal,
        discounts: validatedData.discounts,
        taxes: validatedData.taxes,
        total,
        currency: validatedData.currency,
        validUntil: new Date(validatedData.validUntil),
        status: 'DRAFT',
        notes: validatedData.notes,
        createdBy: user.id,
        items: {
          create: validatedData.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        items: true,
        client: true,
        opportunity: true,
        lead: true,
      },
    })

    revalidatePath('/quotations')
    revalidatePath('/opportunities')

    return { 
      success: true, 
      data: serializeQuotation(quotation),
      message: 'Cotización creada exitosamente' 
    }

  } catch (error) {
    console.error('Error creating quotation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al crear la cotización' 
    }
  }
}

/**
 * Update an existing quotation
 */
export async function updateQuotationAction(data: UpdateQuotationRequest): Promise<ActionResult<any>> {
  try {
    const { user, tenantId } = await getUserWithTenant()
    
    if (!tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }

    // Validate input data
    const validatedData = UpdateQuotationSchema.parse(data)

    // Check if quotation exists and belongs to tenant
    const existingQuotation = await db.quotation.findFirst({
      where: { 
        id: validatedData.id,
        tenantId,
      },
      include: { items: true },
    })

    if (!existingQuotation) {
      return { success: false, error: 'Cotización no encontrada' }
    }

    // Check if quotation can be updated (not sent or accepted)
    if (['SENT', 'ACCEPTED', 'CONVERTED'].includes(existingQuotation.status)) {
      return { success: false, error: 'No se puede editar una cotización enviada o aceptada' }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.discounts !== undefined) updateData.discounts = validatedData.discounts
    if (validatedData.taxes !== undefined) updateData.taxes = validatedData.taxes
    if (validatedData.currency !== undefined) updateData.currency = validatedData.currency
    if (validatedData.validUntil !== undefined) updateData.validUntil = new Date(validatedData.validUntil)
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    // Handle items update
    if (validatedData.items) {
      // Validate items
      if (!validateQuotationItems(validatedData.items)) {
        return { success: false, error: 'Los totales de los items no son válidos' }
      }

      const discountsValue = validatedData.discounts !== undefined ? validatedData.discounts : Number(existingQuotation.discounts)
      const taxesValue = validatedData.taxes !== undefined ? validatedData.taxes : Number(existingQuotation.taxes)
      
      // Calculate new totals
      const { subtotal, total } = calculateQuotationTotals(
        validatedData.items,
        discountsValue,
        taxesValue
      )

      updateData.subtotal = subtotal
      updateData.total = total

      // Delete existing items and create new ones
      updateData.items = {
        deleteMany: { quotationId: validatedData.id },
        create: validatedData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      }
    } else {
      // Recalculate totals if discounts or taxes changed
      if (validatedData.discounts !== undefined || validatedData.taxes !== undefined) {
        const { subtotal, total } = calculateQuotationTotals(
          existingQuotation.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })),
          validatedData.discounts !== undefined ? validatedData.discounts : Number(existingQuotation.discounts),
          validatedData.taxes !== undefined ? validatedData.taxes : Number(existingQuotation.taxes)
        )
        updateData.subtotal = subtotal
        updateData.total = total
      }
    }

    // Update quotation
    const quotation = await db.quotation.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        items: true,
        client: true,
        opportunity: true,
        lead: true,
      },
    })

    revalidatePath('/quotations')
    revalidatePath('/opportunities')

    return { 
      success: true, 
      data: serializeQuotation(quotation),
      message: 'Cotización actualizada exitosamente' 
    }

  } catch (error) {
    console.error('Error updating quotation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al actualizar la cotización' 
    }
  }
}

/**
 * Delete a quotation
 */
export async function deleteQuotationAction(data: DeleteQuotationRequest): Promise<ActionResult<any>> {
  try {
    const { user, tenantId } = await getUserWithTenant()
    
    if (!tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }

    // Validate input data
    const validatedData = DeleteQuotationSchema.parse(data)

    // Check if quotation exists and belongs to tenant
    const existingQuotation = await db.quotation.findFirst({
      where: { 
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingQuotation) {
      return { success: false, error: 'Cotización no encontrada' }
    }

    // Check if quotation can be deleted
    if (['ACCEPTED', 'CONVERTED'].includes(existingQuotation.status)) {
      return { success: false, error: 'No se puede eliminar una cotización aceptada o convertida' }
    }

    // Delete quotation (items will be deleted by cascade)
    await db.quotation.delete({
      where: { id: validatedData.id },
    })

    revalidatePath('/quotations')
    revalidatePath('/opportunities')

    return { 
      success: true, 
      message: 'Cotización eliminada exitosamente' 
    }

  } catch (error) {
    console.error('Error deleting quotation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al eliminar la cotización' 
    }
  }
}

/**
 * Get a specific quotation
 */
export async function getQuotationAction(data: GetQuotationRequest): Promise<ActionResult<any>> {
  try {
    const { user, tenantId } = await getUserWithTenant()
    
    if (!tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }

    // Validate input data
    const validatedData = GetQuotationSchema.parse(data)

    // Get quotation
    const quotation = await db.quotation.findFirst({
      where: { 
        id: validatedData.id,
        tenantId,
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
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
            company: true,
          },
        },
      },
    })

    if (!quotation) {
      return { success: false, error: 'Cotización no encontrada' }
    }

    return { 
      success: true, 
      data: serializeQuotation(quotation) 
    }

  } catch (error) {
    console.error('Error getting quotation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener la cotización' 
    }
  }
}

/**
 * List quotations with pagination and filters
 */
export async function listQuotationsAction(data: ListQuotationsRequest): Promise<ActionResult<any>> {
  try {
    const { user, tenantId } = await getUserWithTenant()
    
    if (!tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }

    // Validate input data
    const validatedData = ListQuotationsSchema.parse(data)

    // Build where clause
    const where: any = { tenantId }

    if (validatedData.search) {
      where.OR = [
        { title: { contains: validatedData.search, mode: 'insensitive' } },
        { number: { contains: validatedData.search, mode: 'insensitive' } },
        { client: { name: { contains: validatedData.search, mode: 'insensitive' } } },
      ]
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.clientId) {
      where.clientId = validatedData.clientId
    }

    if (validatedData.opportunityId) {
      where.opportunityId = validatedData.opportunityId
    }

    if (validatedData.leadId) {
      where.leadId = validatedData.leadId
    }

    if (validatedData.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: new Date(validatedData.createdAfter) }
    }

    if (validatedData.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(validatedData.createdBefore) }
    }

    if (validatedData.validUntilAfter) {
      where.validUntil = { ...where.validUntil, gte: new Date(validatedData.validUntilAfter) }
    }

    if (validatedData.validUntilBefore) {
      where.validUntil = { ...where.validUntil, lte: new Date(validatedData.validUntilBefore) }
    }

    // Get total count
    const totalCount = await db.quotation.count({ where })

    // Get quotations
    const quotations = await db.quotation.findMany({
      where,
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
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
            company: true,
          },
        },
      },
      orderBy: { [validatedData.sortBy]: validatedData.sortOrder },
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
    })

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedData.limit)
    const hasNext = validatedData.page < totalPages
    const hasPrev = validatedData.page > 1

    // Ensure all quotations are properly serialized
    const serializedQuotations = quotations.map(q => {
      const serialized = serializeQuotation(q)
      // Double-check that Decimal values are converted
      if (serialized.subtotal && typeof serialized.subtotal !== 'number') {
        console.error('Serialization failed for subtotal:', serialized.subtotal)
      }
      return serialized
    })

    return {
      success: true,
      data: {
        quotations: serializedQuotations,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total: totalCount,
          totalPages,
          hasNext,
          hasPrev,
        },
      },
    }

  } catch (error) {
    console.error('Error listing quotations:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al listar las cotizaciones' 
    }
  }
}

/**
 * Change quotation status
 */
export async function changeQuotationStatusAction(data: ChangeQuotationStatusRequest): Promise<ActionResult<any>> {
  try {
    const { user, tenantId } = await getUserWithTenant()
    
    if (!tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }

    // Validate input data
    const validatedData = ChangeQuotationStatusSchema.parse(data)

    // Check if quotation exists and belongs to tenant
    const existingQuotation = await db.quotation.findFirst({
      where: { 
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingQuotation) {
      return { success: false, error: 'Cotización no encontrada' }
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['SENT', 'REJECTED', 'EXPIRED'],
      'SENT': ['VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      'VIEWED': ['ACCEPTED', 'REJECTED', 'EXPIRED'],
      'ACCEPTED': ['CONVERTED'],
      'REJECTED': ['DRAFT'],
      'EXPIRED': ['DRAFT'],
      'CONVERTED': [], // Final state
    }

    if (!validTransitions[existingQuotation.status]?.includes(validatedData.status)) {
      return { 
        success: false, 
        error: `No se puede cambiar el estado de ${existingQuotation.status} a ${validatedData.status}` 
      }
    }

    // Update quotation status
    const quotation = await db.quotation.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes,
        approvedBy: validatedData.status === 'ACCEPTED' ? user.id : undefined,
        approvedAt: validatedData.status === 'ACCEPTED' ? new Date() : undefined,
      },
      include: {
        items: true,
        client: true,
        opportunity: true,
        lead: true,
      },
    })

    revalidatePath('/quotations')
    revalidatePath('/opportunities')

    return { 
      success: true, 
      data: serializeQuotation(quotation),
      message: `Estado de cotización cambiado a ${validatedData.status}` 
    }

  } catch (error) {
    console.error('Error changing quotation status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al cambiar el estado de la cotización' 
    }
  }
}

/**
 * Duplicate a quotation (create version)
 */
export async function duplicateQuotationAction(data: DuplicateQuotationRequest): Promise<ActionResult<any>> {
  try {
    const { user, tenantId } = await getUserWithTenant()
    
    if (!tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }

    // Validate input data
    const validatedData = DuplicateQuotationSchema.parse(data)

    // Get original quotation
    const originalQuotation = await db.quotation.findFirst({
      where: { 
        id: validatedData.id,
        tenantId,
      },
      include: { items: true },
    })

    if (!originalQuotation) {
      return { success: false, error: 'Cotización original no encontrada' }
    }

    // Get next version number
    const existingVersions = await db.quotation.findMany({
      where: {
        tenantId,
        number: { startsWith: originalQuotation.number.split('-v')[0] },
      },
      select: { number: true },
    })

    const versionNumbers = existingVersions
      .map(q => q.number.split('-v')[1])
      .filter(v => v && !isNaN(parseInt(v)))
      .map(v => parseInt(v))

    const nextVersion = Math.max(...versionNumbers, 0) + 1
    const newNumber = generateQuotationVersion(
      originalQuotation.number.split('-v')[0],
      nextVersion
    )

    // Create duplicate quotation
    const duplicatedQuotation = await db.quotation.create({
      data: {
        tenantId,
        clientId: originalQuotation.clientId,
        opportunityId: originalQuotation.opportunityId,
        leadId: originalQuotation.leadId,
        number: newNumber,
        title: validatedData.title || `${originalQuotation.title} (v${nextVersion})`,
        description: originalQuotation.description,
        subtotal: originalQuotation.subtotal,
        discounts: originalQuotation.discounts,
        taxes: originalQuotation.taxes,
        total: originalQuotation.total,
        currency: originalQuotation.currency,
        validUntil: validatedData.validUntil 
          ? new Date(validatedData.validUntil) 
          : originalQuotation.validUntil,
        status: 'DRAFT',
        notes: originalQuotation.notes,
        createdBy: user.id,
        items: {
          create: originalQuotation.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        items: true,
        client: true,
        opportunity: true,
        lead: true,
      },
    })

    revalidatePath('/quotations')
    revalidatePath('/opportunities')

    return { 
      success: true, 
      data: serializeQuotation(duplicatedQuotation),
      message: 'Cotización duplicada exitosamente' 
    }

  } catch (error) {
    console.error('Error duplicating quotation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al duplicar la cotización' 
    }
  }
}

/**
 * Get quotation statistics
 */
export async function getQuotationStatsAction(data: GetQuotationStatsRequest): Promise<ActionResult<any>> {
  try {
    const { user, tenantId } = await getUserWithTenant()
    
    if (!tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }

    // Validate input data
    const validatedData = GetQuotationStatsSchema.parse(data)

    // Build where clause
    const where: any = { tenantId }

    if (validatedData.dateFrom) {
      where.createdAt = { ...where.createdAt, gte: new Date(validatedData.dateFrom) }
    }

    if (validatedData.dateTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(validatedData.dateTo) }
    }

    if (validatedData.clientId) {
      where.clientId = validatedData.clientId
    }

    if (validatedData.opportunityId) {
      where.opportunityId = validatedData.opportunityId
    }

    // Get basic stats
    const [totalCount, totalValue, statusCounts] = await Promise.all([
      db.quotation.count({ where }),
      db.quotation.aggregate({
        where,
        _sum: { total: true },
      }),
      db.quotation.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
        _sum: { total: true },
      }),
    ])

    // Calculate conversion rate
    const acceptedCount = statusCounts.find(s => s.status === 'ACCEPTED')?._count._all || 0
    const sentCount = statusCounts.find(s => s.status === 'SENT')?._count._all || 0
    const conversionRate = sentCount > 0 ? (acceptedCount / sentCount) * 100 : 0

    // Format status statistics
    const statusStats = statusCounts.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count._all,
        value: Number(stat._sum.total || 0),
      }
      return acc
    }, {} as Record<string, { count: number; value: number }>)

    const stats = {
      totalCount,
      totalValue: Number(totalValue._sum.total || 0),
      averageValue: totalCount > 0 ? Number(totalValue._sum.total || 0) / totalCount : 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      statusBreakdown: statusStats,
    }

    return { 
      success: true, 
      data: serializeQuotationStats(stats) 
    }

  } catch (error) {
    console.error('Error getting quotation stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas de cotizaciones' 
    }
  }
}