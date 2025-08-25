'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@/types/database'
import {
  createSpaceSchema,
  updateSpaceSchema,
  deleteSpaceSchema,
  getSpaceSchema,
  listSpacesSchema,
  checkSpaceAvailabilitySchema,
  bulkUpdateSpacesSchema,
  getSpaceStatsSchema,
  getSpaceUtilizationSchema,
  calculateSpacePricingSchema,
  type CreateSpaceRequest,
  type UpdateSpaceRequest,
  type DeleteSpaceRequest,
  type GetSpaceRequest,
  type ListSpacesRequest,
  type CheckSpaceAvailabilityRequest,
  type BulkUpdateSpacesRequest,
  type GetSpaceStatsRequest,
  type GetSpaceUtilizationRequest,
  type CalculateSpacePricingRequest,
} from '@/lib/validations/space'
import { PricingCalculator } from '@/lib/utils/pricing'

/**
 * Create a new space
 */
export async function createSpaceAction(data: CreateSpaceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createSpaceSchema.parse(data)

    // Create space
    const space = await prisma.space.create({
      data: {
        ...validatedData,
        tenantId,
        amenities: validatedData.amenities ? JSON.stringify(validatedData.amenities) : null,
        location: validatedData.location ? JSON.stringify(validatedData.location) : null,
        pricingTiers: validatedData.pricingTiers ? JSON.stringify(validatedData.pricingTiers) : null,
        availabilityRules: validatedData.availabilityRules ? JSON.stringify(validatedData.availabilityRules) : null,
        images: validatedData.images ? JSON.stringify(validatedData.images) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      },
      include: {
        tenant: true,
      },
    })

    revalidatePath('/spaces')
    
    return { 
      success: true, 
      data: {
        ...space,
        amenities: space.amenities ? JSON.parse(space.amenities) : [],
        location: space.location ? JSON.parse(space.location) : null,
        pricingTiers: space.pricingTiers ? JSON.parse(space.pricingTiers) : [],
        availabilityRules: space.availabilityRules ? JSON.parse(space.availabilityRules) : [],
        images: space.images ? JSON.parse(space.images) : [],
        metadata: space.metadata ? JSON.parse(space.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create space error:', error)
    
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

    return { success: false, error: 'Failed to create space' }
  }
}

/**
 * Update an existing space
 */
export async function updateSpaceAction(data: UpdateSpaceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = updateSpaceSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Check if space exists and belongs to tenant
    const existingSpace = await prisma.space.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!existingSpace) {
      return { success: false, error: 'Space not found' }
    }

    // Prepare update data with JSON stringification
    const processedUpdateData: any = { ...updateData }
    if (updateData.amenities) {
      processedUpdateData.amenities = JSON.stringify(updateData.amenities)
    }
    if (updateData.location) {
      processedUpdateData.location = JSON.stringify(updateData.location)
    }
    if (updateData.pricingTiers) {
      processedUpdateData.pricingTiers = JSON.stringify(updateData.pricingTiers)
    }
    if (updateData.availabilityRules) {
      processedUpdateData.availabilityRules = JSON.stringify(updateData.availabilityRules)
    }
    if (updateData.images) {
      processedUpdateData.images = JSON.stringify(updateData.images)
    }
    if (updateData.metadata) {
      processedUpdateData.metadata = JSON.stringify(updateData.metadata)
    }

    // Update space
    const space = await prisma.space.update({
      where: { id },
      data: processedUpdateData,
      include: {
        tenant: true,
      },
    })

    revalidatePath('/spaces')
    revalidatePath(`/spaces/${id}`)
    
    return { 
      success: true, 
      data: {
        ...space,
        amenities: space.amenities ? JSON.parse(space.amenities) : [],
        location: space.location ? JSON.parse(space.location) : null,
        pricingTiers: space.pricingTiers ? JSON.parse(space.pricingTiers) : [],
        availabilityRules: space.availabilityRules ? JSON.parse(space.availabilityRules) : [],
        images: space.images ? JSON.parse(space.images) : [],
        metadata: space.metadata ? JSON.parse(space.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Update space error:', error)
    
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

    return { success: false, error: 'Failed to update space' }
  }
}

/**
 * Delete a space
 */
export async function deleteSpaceAction(data: DeleteSpaceRequest): Promise<ActionResult<void>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = deleteSpaceSchema.parse(data)

    // Check if space exists and belongs to tenant
    const existingSpace = await prisma.space.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingSpace) {
      return { success: false, error: 'Space not found' }
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        spaceId: validatedData.id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'],
        },
      },
    })

    if (activeBookings > 0) {
      return { 
        success: false, 
        error: 'Cannot delete space with active bookings. Please cancel or complete all bookings first.' 
      }
    }

    // Soft delete by setting isActive to false instead of actual deletion
    await prisma.space.update({
      where: { id: validatedData.id },
      data: { 
        isActive: false,
        status: 'UNAVAILABLE',
      },
    })

    revalidatePath('/spaces')
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete space error:', error)
    
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

    return { success: false, error: 'Failed to delete space' }
  }
}

/**
 * Get a space by ID
 */
export async function getSpaceAction(data: GetSpaceRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getSpaceSchema.parse(data)

    // Get space
    const space = await prisma.space.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        tenant: true,
      },
    })

    if (!space) {
      return { success: false, error: 'Space not found' }
    }
    
    return { 
      success: true, 
      data: {
        ...space,
        amenities: space.amenities ? JSON.parse(space.amenities) : [],
        location: space.location ? JSON.parse(space.location) : null,
        pricingTiers: space.pricingTiers ? JSON.parse(space.pricingTiers) : [],
        availabilityRules: space.availabilityRules ? JSON.parse(space.availabilityRules) : [],
        images: space.images ? JSON.parse(space.images) : [],
        metadata: space.metadata ? JSON.parse(space.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Get space error:', error)
    
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

    return { success: false, error: 'Failed to get space' }
  }
}

/**
 * List spaces with filtering and pagination
 */
export async function listSpacesAction(data: ListSpacesRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listSpacesSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.search) {
      where.OR = [
        { name: { contains: validatedData.search, mode: 'insensitive' } },
        { description: { contains: validatedData.search, mode: 'insensitive' } },
      ]
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.capacity) {
      if (validatedData.capacity.min) {
        where.capacity = { ...where.capacity, gte: validatedData.capacity.min }
      }
      if (validatedData.capacity.max) {
        where.capacity = { ...where.capacity, lte: validatedData.capacity.max }
      }
    }

    if (validatedData.priceRange) {
      if (validatedData.priceRange.min) {
        where.basePrice = { ...where.basePrice, gte: validatedData.priceRange.min }
      }
      if (validatedData.priceRange.max) {
        where.basePrice = { ...where.basePrice, lte: validatedData.priceRange.max }
      }
    }

    if (validatedData.isActive !== undefined) {
      where.isActive = validatedData.isActive
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.space.count({ where })

    // Get spaces
    const spaces = await prisma.space.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
      },
    })

    // Process JSON fields
    const processedSpaces = spaces.map(space => ({
      ...space,
      amenities: space.amenities ? JSON.parse(space.amenities) : [],
      location: space.location ? JSON.parse(space.location) : null,
      pricingTiers: space.pricingTiers ? JSON.parse(space.pricingTiers) : [],
      availabilityRules: space.availabilityRules ? JSON.parse(space.availabilityRules) : [],
      images: space.images ? JSON.parse(space.images) : [],
      metadata: space.metadata ? JSON.parse(space.metadata) : null,
    }))
    
    return { 
      success: true, 
      data: {
        spaces: processedSpaces,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List spaces error:', error)
    
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

    return { success: false, error: 'Failed to list spaces' }
  }
}

/**
 * Check space availability for a time period
 */
export async function checkSpaceAvailabilityAction(data: CheckSpaceAvailabilityRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = checkSpaceAvailabilitySchema.parse(data)

    // Check if space exists and belongs to tenant
    const space = await prisma.space.findFirst({
      where: {
        id: validatedData.spaceId,
        tenantId,
        isActive: true,
      },
    })

    if (!space) {
      return { success: false, error: 'Space not found' }
    }

    // Check for conflicting bookings
    const conflictWhere: any = {
      spaceId: validatedData.spaceId,
      status: {
        in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'],
      },
      OR: [
        {
          AND: [
            { startTime: { lte: validatedData.startTime } },
            { endTime: { gt: validatedData.startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: validatedData.endTime } },
            { endTime: { gte: validatedData.endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: validatedData.startTime } },
            { endTime: { lte: validatedData.endTime } },
          ],
        },
      ],
    }

    if (validatedData.excludeBookingId) {
      conflictWhere.id = { not: validatedData.excludeBookingId }
    }

    const conflicts = await prisma.booking.findMany({
      where: conflictWhere,
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    })

    const isAvailable = conflicts.length === 0

    return { 
      success: true, 
      data: {
        isAvailable,
        conflicts,
        space: {
          id: space.id,
          name: space.name,
          type: space.type,
          capacity: space.capacity,
          status: space.status,
        },
      }
    }
  } catch (error: any) {
    console.error('Check space availability error:', error)
    
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

    return { success: false, error: 'Failed to check space availability' }
  }
}

/**
 * Bulk update spaces
 */
export async function bulkUpdateSpacesAction(data: BulkUpdateSpacesRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = bulkUpdateSpacesSchema.parse(data)

    // Check if all spaces exist and belong to tenant
    const existingSpaces = await prisma.space.findMany({
      where: {
        id: { in: validatedData.spaceIds },
        tenantId,
      },
      select: { id: true },
    })

    if (existingSpaces.length !== validatedData.spaceIds.length) {
      return { success: false, error: 'One or more spaces not found' }
    }

    // Prepare update data
    const updateData: any = {}
    if (validatedData.updates.status) updateData.status = validatedData.updates.status
    if (validatedData.updates.isActive !== undefined) updateData.isActive = validatedData.updates.isActive
    if (validatedData.updates.basePrice !== undefined) updateData.basePrice = validatedData.updates.basePrice
    if (validatedData.updates.pricingMode) updateData.pricingMode = validatedData.updates.pricingMode
    if (validatedData.updates.requiresApproval !== undefined) updateData.requiresApproval = validatedData.updates.requiresApproval
    if (validatedData.updates.metadata) updateData.metadata = JSON.stringify(validatedData.updates.metadata)

    // Update spaces
    const result = await prisma.space.updateMany({
      where: {
        id: { in: validatedData.spaceIds },
        tenantId,
      },
      data: updateData,
    })

    revalidatePath('/spaces')
    
    return { 
      success: true, 
      data: {
        updatedCount: result.count,
        spaceIds: validatedData.spaceIds,
      }
    }
  } catch (error: any) {
    console.error('Bulk update spaces error:', error)
    
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

    return { success: false, error: 'Failed to bulk update spaces' }
  }
}

/**
 * Get space statistics
 */
export async function getSpaceStatsAction(data: GetSpaceStatsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getSpaceStatsSchema.parse(data)

    // Build date range
    const startDate = validatedData.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const endDate = validatedData.endDate || new Date()

    // Build where clause for bookings
    const bookingWhere: any = {
      space: { tenantId },
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    }

    if (validatedData.spaceId) {
      bookingWhere.spaceId = validatedData.spaceId
    }

    // Get booking statistics
    const bookingStats = await prisma.booking.groupBy({
      by: ['spaceId'],
      where: bookingWhere,
      _count: { id: true },
      _sum: { totalAmount: true },
    })

    // Get space details
    const spaceWhere: any = { tenantId }
    if (validatedData.spaceId) {
      spaceWhere.id = validatedData.spaceId
    }

    const spaces = await prisma.space.findMany({
      where: spaceWhere,
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
        basePrice: true,
      },
    })

    // Combine stats with space details
    const stats = spaces.map(space => {
      const spaceStats = bookingStats.find(stat => stat.spaceId === space.id)
      return {
        space,
        bookingCount: spaceStats?._count.id || 0,
        totalRevenue: Number(spaceStats?._sum.totalAmount || 0),
      }
    })

    return { 
      success: true, 
      data: {
        stats,
        period: {
          startDate,
          endDate,
          groupBy: validatedData.groupBy,
        },
      }
    }
  } catch (error: any) {
    console.error('Get space stats error:', error)
    
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

    return { success: false, error: 'Failed to get space statistics' }
  }
}

/**
 * Get space utilization data
 */
export async function getSpaceUtilizationAction(data: GetSpaceUtilizationRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getSpaceUtilizationSchema.parse(data)

    // Build where clause
    const where: any = {
      space: { tenantId },
      startTime: { gte: validatedData.startDate },
      endTime: { lte: validatedData.endDate },
      status: {
        in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'],
      },
    }

    if (validatedData.spaceIds && validatedData.spaceIds.length > 0) {
      where.spaceId = { in: validatedData.spaceIds }
    }

    // Get bookings for utilization calculation
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        spaceId: true,
        startTime: true,
        endTime: true,
        space: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    // Calculate utilization by granularity
    const utilizationData: any = {}

    bookings.forEach(booking => {
      const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60) // hours
      
      let periodKey: string
      switch (validatedData.granularity) {
        case 'hour':
          periodKey = booking.startTime.toISOString().substring(0, 13) // YYYY-MM-DDTHH
          break
        case 'day':
          periodKey = booking.startTime.toISOString().substring(0, 10) // YYYY-MM-DD
          break
        case 'week':
          const week = new Date(booking.startTime)
          week.setDate(week.getDate() - week.getDay()) // Start of week
          periodKey = week.toISOString().substring(0, 10)
          break
        default:
          periodKey = booking.startTime.toISOString().substring(0, 10)
      }

      if (!utilizationData[periodKey]) {
        utilizationData[periodKey] = {}
      }
      if (!utilizationData[periodKey][booking.spaceId]) {
        utilizationData[periodKey][booking.spaceId] = {
          space: booking.space,
          totalHours: 0,
          bookingCount: 0,
        }
      }

      utilizationData[periodKey][booking.spaceId].totalHours += duration
      utilizationData[periodKey][booking.spaceId].bookingCount += 1
    })

    return { 
      success: true, 
      data: {
        utilization: utilizationData,
        period: {
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          granularity: validatedData.granularity,
        },
      }
    }
  } catch (error: any) {
    console.error('Get space utilization error:', error)
    
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

    return { success: false, error: 'Failed to get space utilization' }
  }
}

/**
 * Calculate space pricing for a booking
 */
export async function calculateSpacePricingAction(data: CalculateSpacePricingRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = calculateSpacePricingSchema.parse(data)

    // Get space details
    const space = await prisma.space.findFirst({
      where: {
        id: validatedData.spaceId,
        tenantId,
        isActive: true,
      },
    })

    if (!space) {
      return { success: false, error: 'Space not found' }
    }

    // Calculate duration in hours
    const duration = (validatedData.endTime.getTime() - validatedData.startTime.getTime()) / (1000 * 60 * 60)

    // Get space pricing tiers
    const pricingTiers = space.pricingTiers ? JSON.parse(space.pricingTiers) : []

    // Create line item for pricing calculation
    const lineItems = [{
      id: space.id,
      description: `${space.name} - ${duration} hours`,
      quantity: duration,
      unitPrice: space.basePrice,
      category: 'space_rental',
      spaceId: space.id,
    }]

    // Build pricing context
    const context = {
      clientId: validatedData.clientId || 'anonymous',
      spaceType: space.type,
      bookingDuration: duration,
      discountCodes: validatedData.discountCodes || [],
      date: validatedData.startTime,
    }

    // Use pricing calculator (would need to load actual pricing rules from database)
    const calculator = new PricingCalculator([], [], [])
    const pricing = calculator.calculatePricing(lineItems, context)

    return { 
      success: true, 
      data: {
        space: {
          id: space.id,
          name: space.name,
          type: space.type,
          basePrice: space.basePrice,
          pricingMode: space.pricingMode,
        },
        booking: {
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          duration,
        },
        pricing,
      }
    }
  } catch (error: any) {
    console.error('Calculate space pricing error:', error)
    
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

    return { success: false, error: 'Failed to calculate space pricing' }
  }
}