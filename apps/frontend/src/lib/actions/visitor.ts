import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@sweetspot/shared'
import {
  createVisitorSchema,
  updateVisitorSchema,
  deleteVisitorSchema,
  getVisitorSchema,
  listVisitorsSchema,
  checkInVisitorSchema,
  checkOutVisitorSchema,
  preRegisterVisitorSchema,
  blacklistVisitorSchema,
  searchVisitorSchema,
  getVisitorStatsSchema,
  type CreateVisitorRequest,
  type UpdateVisitorRequest,
  type DeleteVisitorRequest,
  type GetVisitorRequest,
  type ListVisitorsRequest,
  type CheckInVisitorRequest,
  type CheckOutVisitorRequest,
  type PreRegisterVisitorRequest,
  type BlacklistVisitorRequest,
  type SearchVisitorRequest,
  type GetVisitorStatsRequest,
} from '@/lib/validations/visitor'
import { randomBytes } from 'crypto'

/**
 * Create a new visitor
 */
export async function createVisitorAction(data: CreateVisitorRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createVisitorSchema.parse(data)

    // Verify host user exists if specified
    if (validatedData.hostUserId) {
      const hostUser = await prisma.user.findFirst({
        where: {
          id: validatedData.hostUserId,
          tenantId,
        },
      })

      if (!hostUser) {
        return { success: false, error: 'Host user not found' }
      }
    }

    // Verify client exists if specified
    if (validatedData.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: validatedData.clientId,
          tenantId,
        },
      })

      if (!client) {
        return { success: false, error: 'Client not found' }
      }
    }

    // Check if visitor is blacklisted
    const existingBlacklisted = await prisma.visitor.findFirst({
      where: {
        tenantId,
        isBlacklisted: true,
        OR: [
          {
            contactInfo: {
              path: '$.email',
              equals: validatedData.contactInfo.email,
            },
          },
          {
            contactInfo: {
              path: '$.phone',
              equals: validatedData.contactInfo.phone,
            },
          },
          validatedData.idVerification?.number ? {
            idVerification: {
              path: '$.number',
              equals: validatedData.idVerification.number,
            },
          } : {},
        ].filter(condition => Object.keys(condition).length > 0),
      },
    })

    if (existingBlacklisted) {
      return { 
        success: false, 
        error: 'Visitor is blacklisted',
        details: { blacklistReason: existingBlacklisted.blacklistReason }
      }
    }

    // Create visitor
    const visitor = await prisma.visitor.create({
      data: {
        ...validatedData,
        tenantId,
        contactInfo: JSON.stringify(validatedData.contactInfo),
        emergencyContact: validatedData.emergencyContact ? JSON.stringify(validatedData.emergencyContact) : null,
        idVerification: validatedData.idVerification ? JSON.stringify(validatedData.idVerification) : null,
        vehicleInfo: validatedData.vehicleInfo ? JSON.stringify(validatedData.vehicleInfo) : null,
        accessPermissions: JSON.stringify(validatedData.accessPermissions || {}),
        healthSafety: JSON.stringify(validatedData.healthSafety || {}),
        recurrenceRule: validatedData.recurrenceRule ? JSON.stringify(validatedData.recurrenceRule) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        createdBy: user.id,
      },
      include: {
        tenant: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: true,
      },
    })

    revalidatePath('/visitors')
    
    return { 
      success: true, 
      data: {
        ...visitor,
        contactInfo: JSON.parse(visitor.contactInfo),
        emergencyContact: visitor.emergencyContact ? JSON.parse(visitor.emergencyContact) : null,
        idVerification: visitor.idVerification ? JSON.parse(visitor.idVerification) : null,
        vehicleInfo: visitor.vehicleInfo ? JSON.parse(visitor.vehicleInfo) : null,
        accessPermissions: JSON.parse(visitor.accessPermissions),
        healthSafety: JSON.parse(visitor.healthSafety),
        recurrenceRule: visitor.recurrenceRule ? JSON.parse(visitor.recurrenceRule) : null,
        metadata: visitor.metadata ? JSON.parse(visitor.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create visitor error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create visitor' }
  }
}

/**
 * Update an existing visitor
 */
export async function updateVisitorAction(data: UpdateVisitorRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = updateVisitorSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Check if visitor exists and belongs to tenant
    const existingVisitor = await prisma.visitor.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!existingVisitor) {
      return { success: false, error: 'Visitor not found' }
    }

    // Don't allow updating if visitor is checked in
    if (existingVisitor.status === 'CHECKED_IN') {
      return { success: false, error: 'Cannot update visitor while checked in' }
    }

    // Prepare update data with JSON stringification
    const processedUpdateData: any = { ...updateData }
    if (updateData.contactInfo) {
      processedUpdateData.contactInfo = JSON.stringify(updateData.contactInfo)
    }
    if (updateData.emergencyContact) {
      processedUpdateData.emergencyContact = JSON.stringify(updateData.emergencyContact)
    }
    if (updateData.idVerification) {
      processedUpdateData.idVerification = JSON.stringify(updateData.idVerification)
    }
    if (updateData.vehicleInfo) {
      processedUpdateData.vehicleInfo = JSON.stringify(updateData.vehicleInfo)
    }
    if (updateData.accessPermissions) {
      processedUpdateData.accessPermissions = JSON.stringify(updateData.accessPermissions)
    }
    if (updateData.healthSafety) {
      processedUpdateData.healthSafety = JSON.stringify(updateData.healthSafety)
    }
    if (updateData.recurrenceRule) {
      processedUpdateData.recurrenceRule = JSON.stringify(updateData.recurrenceRule)
    }
    if (updateData.metadata) {
      processedUpdateData.metadata = JSON.stringify(updateData.metadata)
    }

    // Update visitor
    const visitor = await prisma.visitor.update({
      where: { id },
      data: processedUpdateData,
      include: {
        tenant: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: true,
      },
    })

    revalidatePath('/visitors')
    revalidatePath(`/visitors/${id}`)
    
    return { 
      success: true, 
      data: {
        ...visitor,
        contactInfo: JSON.parse(visitor.contactInfo),
        emergencyContact: visitor.emergencyContact ? JSON.parse(visitor.emergencyContact) : null,
        idVerification: visitor.idVerification ? JSON.parse(visitor.idVerification) : null,
        vehicleInfo: visitor.vehicleInfo ? JSON.parse(visitor.vehicleInfo) : null,
        accessPermissions: JSON.parse(visitor.accessPermissions),
        healthSafety: JSON.parse(visitor.healthSafety),
        recurrenceRule: visitor.recurrenceRule ? JSON.parse(visitor.recurrenceRule) : null,
        metadata: visitor.metadata ? JSON.parse(visitor.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Update visitor error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to update visitor' }
  }
}

/**
 * Delete a visitor
 */
export async function deleteVisitorAction(data: DeleteVisitorRequest): Promise<ActionResult<void>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = deleteVisitorSchema.parse(data)

    // Check if visitor exists and belongs to tenant
    const existingVisitor = await prisma.visitor.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingVisitor) {
      return { success: false, error: 'Visitor not found' }
    }

    // Don't allow deleting if visitor is checked in
    if (existingVisitor.status === 'CHECKED_IN') {
      return { success: false, error: 'Cannot delete visitor while checked in' }
    }

    // Soft delete by cancelling
    await prisma.visitor.update({
      where: { id: validatedData.id },
      data: { 
        status: 'CANCELLED',
      },
    })

    revalidatePath('/visitors')
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete visitor error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to delete visitor' }
  }
}

/**
 * Get a visitor by ID
 */
export async function getVisitorAction(data: GetVisitorRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getVisitorSchema.parse(data)

    // Get visitor
    const visitor = await prisma.visitor.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        tenant: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: true,
      },
    })

    if (!visitor) {
      return { success: false, error: 'Visitor not found' }
    }

    // Get access logs for this visitor
    const accessLogs = await prisma.accessLog.findMany({
      where: { 
        visitorId: visitor.id,
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    })
    
    return { 
      success: true, 
      data: {
        ...visitor,
        contactInfo: JSON.parse(visitor.contactInfo),
        emergencyContact: visitor.emergencyContact ? JSON.parse(visitor.emergencyContact) : null,
        idVerification: visitor.idVerification ? JSON.parse(visitor.idVerification) : null,
        vehicleInfo: visitor.vehicleInfo ? JSON.parse(visitor.vehicleInfo) : null,
        accessPermissions: JSON.parse(visitor.accessPermissions),
        healthSafety: JSON.parse(visitor.healthSafety),
        recurrenceRule: visitor.recurrenceRule ? JSON.parse(visitor.recurrenceRule) : null,
        metadata: visitor.metadata ? JSON.parse(visitor.metadata) : null,
        accessLogs,
      }
    }
  } catch (error: any) {
    console.error('Get visitor error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get visitor' }
  }
}

/**
 * List visitors with filtering and pagination
 */
export async function listVisitorsAction(data: ListVisitorsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listVisitorsSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.search) {
      where.OR = [
        { firstName: { contains: validatedData.search, mode: 'insensitive' } },
        { lastName: { contains: validatedData.search, mode: 'insensitive' } },
        { company: { contains: validatedData.search, mode: 'insensitive' } },
      ]
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.purpose) {
      where.purpose = validatedData.purpose
    }

    if (validatedData.hostUserId) {
      where.hostUserId = validatedData.hostUserId
    }

    if (validatedData.clientId) {
      where.clientId = validatedData.clientId
    }

    if (validatedData.dateFrom || validatedData.dateTo) {
      where.expectedArrival = {}
      if (validatedData.dateFrom) {
        where.expectedArrival.gte = validatedData.dateFrom
      }
      if (validatedData.dateTo) {
        where.expectedArrival.lte = validatedData.dateTo
      }
    }

    if (validatedData.isBlacklisted !== undefined) {
      where.isBlacklisted = validatedData.isBlacklisted
    }

    if (validatedData.isRecurring !== undefined) {
      where.isRecurring = validatedData.isRecurring
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.visitor.count({ where })

    // Get visitors
    const visitors = await prisma.visitor.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Process JSON fields
    const processedVisitors = visitors.map(visitor => ({
      ...visitor,
      contactInfo: JSON.parse(visitor.contactInfo),
      emergencyContact: visitor.emergencyContact ? JSON.parse(visitor.emergencyContact) : null,
      idVerification: visitor.idVerification ? JSON.parse(visitor.idVerification) : null,
      vehicleInfo: visitor.vehicleInfo ? JSON.parse(visitor.vehicleInfo) : null,
      accessPermissions: JSON.parse(visitor.accessPermissions),
      healthSafety: JSON.parse(visitor.healthSafety),
      recurrenceRule: visitor.recurrenceRule ? JSON.parse(visitor.recurrenceRule) : null,
      metadata: visitor.metadata ? JSON.parse(visitor.metadata) : null,
    }))
    
    return { 
      success: true, 
      data: {
        visitors: processedVisitors,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List visitors error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to list visitors' }
  }
}

/**
 * Check in a visitor
 */
export async function checkInVisitorAction(data: CheckInVisitorRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = checkInVisitorSchema.parse(data)

    // Get visitor
    const visitor = await prisma.visitor.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!visitor) {
      return { success: false, error: 'Visitor not found' }
    }

    if (visitor.status !== 'REGISTERED' && visitor.status !== 'PRE_REGISTERED') {
      return { success: false, error: 'Visitor must be registered or pre-registered to check in' }
    }

    if (visitor.isBlacklisted) {
      return { success: false, error: 'Cannot check in blacklisted visitor' }
    }

    // Update health safety info if provided
    let healthSafety = JSON.parse(visitor.healthSafety)
    if (validatedData.healthDeclaration !== undefined) {
      healthSafety.healthDeclaration = validatedData.healthDeclaration
    }
    if (validatedData.temperature !== undefined) {
      healthSafety.temperatureCheck = {
        required: true,
        value: validatedData.temperature,
        checkedAt: new Date(),
        checkedBy: user.id,
      }
    }

    // Update access permissions if badge/card provided
    let accessPermissions = JSON.parse(visitor.accessPermissions)
    if (validatedData.badgeNumber) {
      accessPermissions.temporaryBadgeNumber = validatedData.badgeNumber
    }
    if (validatedData.accessCardNumber) {
      accessPermissions.accessCardNumber = validatedData.accessCardNumber
    }

    // Update vehicle info if parking spot provided
    let vehicleInfo = visitor.vehicleInfo ? JSON.parse(visitor.vehicleInfo) : null
    if (validatedData.parkingSpot && vehicleInfo) {
      vehicleInfo.parkingSpot = validatedData.parkingSpot
    }

    // Update visitor
    const updatedVisitor = await prisma.visitor.update({
      where: { id: validatedData.id },
      data: {
        status: 'CHECKED_IN',
        actualArrival: validatedData.actualArrival || new Date(),
        photoUrl: validatedData.photoUrl || visitor.photoUrl,
        signatureUrl: validatedData.signatureUrl || visitor.signatureUrl,
        healthSafety: JSON.stringify(healthSafety),
        accessPermissions: JSON.stringify(accessPermissions),
        vehicleInfo: vehicleInfo ? JSON.stringify(vehicleInfo) : visitor.vehicleInfo,
        notes: validatedData.notes ? 
          `${visitor.notes || ''}\n--- Check-in ---\n${validatedData.notes}`.trim() : 
          visitor.notes,
      },
      include: {
        tenant: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: true,
      },
    })

    // Create access log entry
    await prisma.accessLog.create({
      data: {
        tenantId,
        type: 'ENTRY',
        method: 'MANUAL',
        visitorId: visitor.id,
        granted: true,
        timestamp: new Date(),
        metadata: JSON.stringify({
          checkInBy: user.id,
          checkInAt: new Date(),
          badgeNumber: validatedData.badgeNumber,
          accessCardNumber: validatedData.accessCardNumber,
        }),
      },
    })

    revalidatePath('/visitors')
    revalidatePath(`/visitors/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...updatedVisitor,
        contactInfo: JSON.parse(updatedVisitor.contactInfo),
        emergencyContact: updatedVisitor.emergencyContact ? JSON.parse(updatedVisitor.emergencyContact) : null,
        idVerification: updatedVisitor.idVerification ? JSON.parse(updatedVisitor.idVerification) : null,
        vehicleInfo: updatedVisitor.vehicleInfo ? JSON.parse(updatedVisitor.vehicleInfo) : null,
        accessPermissions: JSON.parse(updatedVisitor.accessPermissions),
        healthSafety: JSON.parse(updatedVisitor.healthSafety),
        recurrenceRule: updatedVisitor.recurrenceRule ? JSON.parse(updatedVisitor.recurrenceRule) : null,
        metadata: updatedVisitor.metadata ? JSON.parse(updatedVisitor.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Check in visitor error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to check in visitor' }
  }
}

/**
 * Check out a visitor
 */
export async function checkOutVisitorAction(data: CheckOutVisitorRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = checkOutVisitorSchema.parse(data)

    // Get visitor
    const visitor = await prisma.visitor.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!visitor) {
      return { success: false, error: 'Visitor not found' }
    }

    if (visitor.status !== 'CHECKED_IN') {
      return { success: false, error: 'Visitor must be checked in before check out' }
    }

    // Update visitor
    const updatedVisitor = await prisma.visitor.update({
      where: { id: validatedData.id },
      data: {
        status: 'CHECKED_OUT',
        actualDeparture: validatedData.actualDeparture || new Date(),
        notes: validatedData.notes ? 
          `${visitor.notes || ''}\n--- Check-out ---\n${validatedData.notes}`.trim() : 
          visitor.notes,
        metadata: JSON.stringify({
          ...(visitor.metadata ? JSON.parse(visitor.metadata) : {}),
          feedback: validatedData.feedback,
          rating: validatedData.rating,
          badgeReturned: validatedData.badgeReturned,
          accessCardReturned: validatedData.accessCardReturned,
        }),
      },
      include: {
        tenant: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: true,
      },
    })

    // Create access log entry
    await prisma.accessLog.create({
      data: {
        tenantId,
        type: 'EXIT',
        method: 'MANUAL',
        visitorId: visitor.id,
        granted: true,
        timestamp: new Date(),
        metadata: JSON.stringify({
          checkOutBy: user.id,
          checkOutAt: new Date(),
          badgeReturned: validatedData.badgeReturned,
          accessCardReturned: validatedData.accessCardReturned,
        }),
      },
    })

    revalidatePath('/visitors')
    revalidatePath(`/visitors/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...updatedVisitor,
        contactInfo: JSON.parse(updatedVisitor.contactInfo),
        emergencyContact: updatedVisitor.emergencyContact ? JSON.parse(updatedVisitor.emergencyContact) : null,
        idVerification: updatedVisitor.idVerification ? JSON.parse(updatedVisitor.idVerification) : null,
        vehicleInfo: updatedVisitor.vehicleInfo ? JSON.parse(updatedVisitor.vehicleInfo) : null,
        accessPermissions: JSON.parse(updatedVisitor.accessPermissions),
        healthSafety: JSON.parse(updatedVisitor.healthSafety),
        recurrenceRule: updatedVisitor.recurrenceRule ? JSON.parse(updatedVisitor.recurrenceRule) : null,
        metadata: updatedVisitor.metadata ? JSON.parse(updatedVisitor.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Check out visitor error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to check out visitor' }
  }
}

/**
 * Pre-register a visitor
 */
export async function preRegisterVisitorAction(data: PreRegisterVisitorRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = preRegisterVisitorSchema.parse(data)

    // Generate pre-registration code
    const preRegistrationCode = randomBytes(8).toString('hex').toUpperCase()
    const preRegistrationExpiresAt = new Date()
    preRegistrationExpiresAt.setDate(preRegistrationExpiresAt.getDate() + validatedData.validityDays)

    // Create visitor with pre-registered status
    const visitorData = {
      ...validatedData,
      status: 'PRE_REGISTERED' as const,
      preRegistrationCode,
      preRegisteredBy: user.id,
      preRegistrationExpiresAt,
    }

    const result = await createVisitorAction(visitorData)

    if (!result.success) {
      return result
    }

    // Send invitation email if requested
    if (validatedData.sendInvitation && validatedData.contactInfo.email) {
      // TODO: Implement email sending
      console.log('Send pre-registration invitation to:', validatedData.contactInfo.email)
    }

    return {
      success: true,
      data: {
        ...result.data,
        preRegistrationUrl: `/visitor-registration/${preRegistrationCode}`,
      },
    }
  } catch (error: any) {
    console.error('Pre-register visitor error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to pre-register visitor' }
  }
}

/**
 * Blacklist a visitor
 */
export async function blacklistVisitorAction(data: BlacklistVisitorRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = blacklistVisitorSchema.parse(data)

    // Get visitor
    const visitor = await prisma.visitor.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!visitor) {
      return { success: false, error: 'Visitor not found' }
    }

    // Update visitor
    const updatedVisitor = await prisma.visitor.update({
      where: { id: validatedData.id },
      data: {
        isBlacklisted: true,
        blacklistReason: validatedData.reason,
        blacklistedAt: validatedData.effectiveFrom || new Date(),
        blacklistedBy: user.id,
        status: 'BLACKLISTED',
        metadata: JSON.stringify({
          ...(visitor.metadata ? JSON.parse(visitor.metadata) : {}),
          blacklistDetails: {
            effectiveFrom: validatedData.effectiveFrom || new Date(),
            effectiveUntil: validatedData.effectiveUntil,
            notifyHost: validatedData.notifyHost,
          },
        }),
      },
      include: {
        tenant: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: true,
      },
    })

    // Notify host if requested
    if (validatedData.notifyHost && visitor.hostUserId) {
      // TODO: Implement notification
      console.log('Notify host about blacklisted visitor:', visitor.hostUserId)
    }

    revalidatePath('/visitors')
    revalidatePath(`/visitors/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...updatedVisitor,
        contactInfo: JSON.parse(updatedVisitor.contactInfo),
        emergencyContact: updatedVisitor.emergencyContact ? JSON.parse(updatedVisitor.emergencyContact) : null,
        idVerification: updatedVisitor.idVerification ? JSON.parse(updatedVisitor.idVerification) : null,
        vehicleInfo: updatedVisitor.vehicleInfo ? JSON.parse(updatedVisitor.vehicleInfo) : null,
        accessPermissions: JSON.parse(updatedVisitor.accessPermissions),
        healthSafety: JSON.parse(updatedVisitor.healthSafety),
        recurrenceRule: updatedVisitor.recurrenceRule ? JSON.parse(updatedVisitor.recurrenceRule) : null,
        metadata: updatedVisitor.metadata ? JSON.parse(updatedVisitor.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Blacklist visitor error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to blacklist visitor' }
  }
}

/**
 * Search visitors
 */
export async function searchVisitorAction(data: SearchVisitorRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = searchVisitorSchema.parse(data)

    // Build search conditions
    const searchConditions = []
    
    if (validatedData.searchFields.includes('name')) {
      searchConditions.push(
        { firstName: { contains: validatedData.query, mode: 'insensitive' } },
        { lastName: { contains: validatedData.query, mode: 'insensitive' } }
      )
    }

    if (validatedData.searchFields.includes('email')) {
      searchConditions.push({
        contactInfo: {
          path: '$.email',
          contains: validatedData.query,
        },
      })
    }

    if (validatedData.searchFields.includes('phone')) {
      searchConditions.push({
        contactInfo: {
          path: '$.phone',
          contains: validatedData.query,
        },
      })
    }

    if (validatedData.searchFields.includes('company')) {
      searchConditions.push(
        { company: { contains: validatedData.query, mode: 'insensitive' } }
      )
    }

    if (validatedData.searchFields.includes('idNumber')) {
      searchConditions.push({
        idVerification: {
          path: '$.number',
          contains: validatedData.query,
        },
      })
    }

    // Build where clause
    const where: any = {
      tenantId,
      OR: searchConditions,
    }

    if (!validatedData.includeBlacklisted) {
      where.isBlacklisted = false
    }

    // Search visitors
    const visitors = await prisma.visitor.findMany({
      where,
      take: validatedData.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Process JSON fields
    const processedVisitors = visitors.map(visitor => ({
      id: visitor.id,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      company: visitor.company,
      type: visitor.type,
      status: visitor.status,
      purpose: visitor.purpose,
      expectedArrival: visitor.expectedArrival,
      isBlacklisted: visitor.isBlacklisted,
      host: visitor.host,
      client: visitor.client,
      contactInfo: JSON.parse(visitor.contactInfo),
    }))
    
    return { 
      success: true, 
      data: {
        results: processedVisitors,
        count: processedVisitors.length,
      }
    }
  } catch (error: any) {
    console.error('Search visitor error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to search visitors' }
  }
}