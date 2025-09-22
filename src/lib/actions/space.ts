'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@/types/database'
import { generateSpaceColor, getNextAvailableColor } from '@/lib/utils/colors'
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
  createSpaceAvailabilityScheduleSchema,
  updateSpaceAvailabilityScheduleSchema,
  createSpaceMaintenanceScheduleSchema,
  updateSpaceMaintenanceScheduleSchema,
  createCheckInOutSchema,
  performCheckOutSchema,
  createBookingWithRecurrenceSchema,
  generateQRCodeSchema,
  getOccupancyDataSchema,
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
  type CreateSpaceAvailabilityScheduleRequest,
  type UpdateSpaceAvailabilityScheduleRequest,
  type CreateSpaceMaintenanceScheduleRequest,
  type UpdateSpaceMaintenanceScheduleRequest,
  type CreateCheckInOutRequest,
  type PerformCheckOutRequest,
  type CreateBookingWithRecurrenceRequest,
  type GenerateQRCodeRequest,
  type GetOccupancyDataRequest,
} from '@/lib/validations/space'
import { PricingCalculator } from '@/lib/utils/pricing'
import { redirect } from 'next/navigation'
import { Decimal } from '@prisma/client/runtime/library'

// Helper function to safely parse JSON fields
function safeJsonParse(jsonString: string | null, fallback: any = null) {
  if (!jsonString || jsonString.trim() === '') return fallback
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error)
    return fallback
  }
}

// Helper function to serialize Decimal fields
function serializeSpaceData(space: any) {
  return {
    ...space,
    hourlyRate: space.hourlyRate ? Number(space.hourlyRate) : null,
    area: space.area ? Number(space.area) : null,
    amenities: safeJsonParse(space.amenities, []),
    location: safeJsonParse(space.location, null),
    pricingTiers: safeJsonParse(space.pricingTiers, []),
    availabilityRules: safeJsonParse(space.availabilityRules, []),
    images: safeJsonParse(space.images, []),
    metadata: safeJsonParse(space.metadata, null),
    isActive: space.isActive ?? true,  // Ensure isActive is always included
  }
}

/**
 * Server Action for creating a space from FormData (Next.js 15.5 best practices)
 */
export async function createSpaceFormAction(formData: FormData) {
  try {
    // Get tenant context
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      throw new Error('Authentication required')
    }

    // Extract and convert form data
    const data: CreateSpaceRequest = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      type: formData.get('type') as string,
      capacity: parseInt(formData.get('capacity') as string),
      hourlyRate: formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : undefined,
      isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
      floor: formData.get('floor') as string || undefined,
      zone: formData.get('zone') as string || undefined,
      area: formData.get('area') ? parseFloat(formData.get('area') as string) : undefined,
      maxAdvanceBooking: formData.get('maxAdvanceBooking') ? parseInt(formData.get('maxAdvanceBooking') as string) : undefined,
      minBookingDuration: formData.get('minBookingDuration') ? parseInt(formData.get('minBookingDuration') as string) : undefined,
      maxBookingDuration: formData.get('maxBookingDuration') ? parseInt(formData.get('maxBookingDuration') as string) : undefined,
      cancellationHours: formData.get('cancellationHours') ? parseInt(formData.get('cancellationHours') as string) : undefined,
      requiresApproval: formData.get('requiresApproval') === 'on' || formData.get('requiresApproval') === 'true',
      allowRecurring: formData.get('allowRecurring') === 'on' || formData.get('allowRecurring') === 'true',
    }

    // Validate and create space
    const result = await createSpaceAction(data)
    if (!result.success) {
      throw new Error(result.error || 'Failed to create space')
    }

    revalidatePath('/spaces')
  } catch (error: any) {
    console.error('Create space form error:', error)
    // In a real app, you might want to handle errors differently
    throw error
  }

  // Redirect on success
  redirect('/spaces')
}

/**
 * Server Action for updating a space from FormData
 */
export async function updateSpaceFormAction(spaceId: string, formData: FormData) {
  try {
    // Get tenant context
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      throw new Error('Authentication required')
    }

    // Extract and convert form data
    const data: UpdateSpaceRequest = {
      id: spaceId,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      type: formData.get('type') as string,
      capacity: parseInt(formData.get('capacity') as string),
      hourlyRate: formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : undefined,
      isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
      floor: formData.get('floor') as string || undefined,
      zone: formData.get('zone') as string || undefined,
      area: formData.get('area') ? parseFloat(formData.get('area') as string) : undefined,
      maxAdvanceBooking: formData.get('maxAdvanceBooking') ? parseInt(formData.get('maxAdvanceBooking') as string) : undefined,
      minBookingDuration: formData.get('minBookingDuration') ? parseInt(formData.get('minBookingDuration') as string) : undefined,
      maxBookingDuration: formData.get('maxBookingDuration') ? parseInt(formData.get('maxBookingDuration') as string) : undefined,
      cancellationHours: formData.get('cancellationHours') ? parseInt(formData.get('cancellationHours') as string) : undefined,
      requiresApproval: formData.get('requiresApproval') === 'on' || formData.get('requiresApproval') === 'true',
      allowRecurring: formData.get('allowRecurring') === 'on' || formData.get('allowRecurring') === 'true',
    }

    // Validate and update space
    const result = await updateSpaceAction(data)
    if (!result.success) {
      throw new Error(result.error || 'Failed to update space')
    }

    revalidatePath('/spaces')
    revalidatePath(`/spaces/${spaceId}`)
  } catch (error: any) {
    console.error('Update space form error:', error)
    throw error
  }

  // Redirect on success
  redirect('/spaces')
}

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

    // Generate color if not provided
    let spaceColor = validatedData.color
    if (!spaceColor) {
      // Get existing space colors to avoid duplicates
      const existingSpaces = await prisma.space.findMany({
        where: { tenantId },
        select: { color: true }
      })
      const usedColors = existingSpaces
        .map(space => space.color)
        .filter(color => color !== null) as string[]

      spaceColor = getNextAvailableColor(usedColors)
    }

    // Create space with only valid database fields
    const space = await prisma.space.create({
      data: {
        tenantId,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        capacity: validatedData.capacity,
        hourlyRate: validatedData.hourlyRate,
        isActive: validatedData.isActive,
        floor: validatedData.floor,
        zone: validatedData.zone,
        area: validatedData.area,
        color: spaceColor,
        maxAdvanceBooking: validatedData.maxAdvanceBooking,
        minBookingDuration: validatedData.minBookingDuration,
        maxBookingDuration: validatedData.maxBookingDuration,
        cancellationHours: validatedData.cancellationHours,
        requiresApproval: validatedData.requiresApproval,
        allowRecurring: validatedData.allowRecurring,
        amenities: validatedData.amenities ? JSON.stringify(validatedData.amenities) : null,
        images: validatedData.images ? JSON.stringify(validatedData.images) : null,
      },
      include: {
        tenant: true,
      },
    })

    revalidatePath('/spaces')
    
    return {
      success: true,
      data: serializeSpaceData(space)
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

    // Prepare update data with only valid database fields
    const processedUpdateData: any = {}

    // Only include fields that exist in the database model
    if (updateData.name !== undefined) processedUpdateData.name = updateData.name
    if (updateData.description !== undefined) processedUpdateData.description = updateData.description
    if (updateData.type !== undefined) processedUpdateData.type = updateData.type
    if (updateData.capacity !== undefined) processedUpdateData.capacity = updateData.capacity
    if (updateData.hourlyRate !== undefined) processedUpdateData.hourlyRate = updateData.hourlyRate
    if (updateData.isActive !== undefined) processedUpdateData.isActive = updateData.isActive
    if (updateData.floor !== undefined) processedUpdateData.floor = updateData.floor
    if (updateData.zone !== undefined) processedUpdateData.zone = updateData.zone
    if (updateData.area !== undefined) processedUpdateData.area = updateData.area
    if (updateData.maxAdvanceBooking !== undefined) processedUpdateData.maxAdvanceBooking = updateData.maxAdvanceBooking
    if (updateData.minBookingDuration !== undefined) processedUpdateData.minBookingDuration = updateData.minBookingDuration
    if (updateData.maxBookingDuration !== undefined) processedUpdateData.maxBookingDuration = updateData.maxBookingDuration
    if (updateData.cancellationHours !== undefined) processedUpdateData.cancellationHours = updateData.cancellationHours
    if (updateData.requiresApproval !== undefined) processedUpdateData.requiresApproval = updateData.requiresApproval
    if (updateData.allowRecurring !== undefined) processedUpdateData.allowRecurring = updateData.allowRecurring

    // Handle JSON fields
    if (updateData.amenities !== undefined) {
      processedUpdateData.amenities = updateData.amenities ? JSON.stringify(updateData.amenities) : null
    }
    if (updateData.images !== undefined) {
      processedUpdateData.images = updateData.images ? JSON.stringify(updateData.images) : null
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
      data: serializeSpaceData(space)
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
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
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
 * Reactivate a space
 */
export async function reactivateSpaceAction(data: DeleteSpaceRequest): Promise<ActionResult<void>> {
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

    // Reactivate by setting isActive to true
    await prisma.space.update({
      where: { id: validatedData.id },
      data: {
        isActive: true,
      },
    })

    revalidatePath('/spaces')

    return { success: true }
  } catch (error: any) {
    console.error('Reactivate space error:', error)

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

    return { success: false, error: 'Failed to reactivate space' }
  }
}

/**
 * Permanently delete a space (hard delete)
 */
export async function permanentDeleteSpaceAction(data: DeleteSpaceRequest): Promise<ActionResult<void>> {
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

    // Check for any bookings (past, present, or future)
    const allBookings = await prisma.booking.count({
      where: {
        spaceId: validatedData.id,
      },
    })

    if (allBookings > 0) {
      return {
        success: false,
        error: 'Cannot permanently delete space with existing bookings. This action would affect booking history and cannot be undone.'
      }
    }

    // Check for other related records that might prevent deletion
    const relatedRecords = await Promise.all([
      prisma.occupancyTracking.count({ where: { spaceId: validatedData.id } }),
      prisma.spaceFeature.count({ where: { spaceId: validatedData.id } }),
      prisma.roomPricingRule.count({ where: { spaceId: validatedData.id } }),
      prisma.roomCheckIn.count({ where: { spaceId: validatedData.id } }),
      prisma.roomAvailability.count({ where: { spaceId: validatedData.id } }),
      prisma.roomMaintenanceLog.count({ where: { spaceId: validatedData.id } }),
      prisma.roomUsageAnalytics.count({ where: { spaceId: validatedData.id } }),
      prisma.spaceAvailabilitySchedule.count({ where: { spaceId: validatedData.id } }),
      prisma.spaceMaintenanceSchedule.count({ where: { spaceId: validatedData.id } }),
      prisma.checkInOut.count({ where: { spaceId: validatedData.id } })
    ])

    const totalRelatedRecords = relatedRecords.reduce((sum, count) => sum + count, 0)

    if (totalRelatedRecords > 0) {
      return {
        success: false,
        error: 'Cannot permanently delete space with related records (occupancy tracking, features, pricing rules, etc.). Consider using soft delete instead.'
      }
    }

    // Perform hard delete - this will permanently remove the space from the database
    await prisma.space.delete({
      where: { id: validatedData.id },
    })

    revalidatePath('/spaces')

    return { success: true }
  } catch (error: any) {
    console.error('Permanent delete space error:', error)

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

    return { success: false, error: 'Failed to permanently delete space' }
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
      data: serializeSpaceData(space)
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

    // Process JSON fields and serialize Decimal fields
    const processedSpaces = spaces.map(space => serializeSpaceData(space))
    
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
        in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
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
        in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'],
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

// ============================================================================
// ENHANCED SPACE MANAGEMENT ACTIONS
// ============================================================================

/**
 * Create space availability schedule
 */
export async function createSpaceAvailabilityScheduleAction(data: any): Promise<ActionResult<any>> {
  try {
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify space belongs to tenant
    const space = await prisma.space.findFirst({
      where: { id: data.spaceId, tenantId }
    })

    if (!space) {
      return { success: false, error: 'Space not found' }
    }

    const schedule = await prisma.spaceAvailabilitySchedule.create({
      data: {
        spaceId: data.spaceId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive ?? true,
      }
    })

    revalidatePath('/spaces')
    return { success: true, data: schedule }
  } catch (error: any) {
    console.error('Create space availability schedule error:', error)
    return { success: false, error: 'Failed to create availability schedule' }
  }
}

/**
 * Assign colors to spaces that don't have one
 */
export async function assignColorsToExistingSpacesAction(): Promise<ActionResult<any>> {
  try {
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Get spaces without colors
    const spacesWithoutColors = await prisma.space.findMany({
      where: {
        tenantId,
        color: null
      },
      select: { id: true, name: true }
    })

    if (spacesWithoutColors.length === 0) {
      return { success: true, data: { message: 'All spaces already have colors assigned' } }
    }

    // Get existing colors
    const existingSpaces = await prisma.space.findMany({
      where: {
        tenantId,
        color: { not: null }
      },
      select: { color: true }
    })

    const usedColors = existingSpaces
      .map(space => space.color)
      .filter(color => color !== null) as string[]

    // Assign colors to spaces without them
    const updates = spacesWithoutColors.map((space, index) => {
      const color = getNextAvailableColor([...usedColors])
      usedColors.push(color) // Add to used colors for next iteration

      return prisma.space.update({
        where: { id: space.id },
        data: { color }
      })
    })

    await Promise.all(updates)

    revalidatePath('/spaces')

    return {
      success: true,
      data: {
        message: `Colors assigned to ${spacesWithoutColors.length} spaces`,
        updatedSpaces: spacesWithoutColors.length
      }
    }
  } catch (error: any) {
    console.error('Assign colors error:', error)
    return { success: false, error: 'Failed to assign colors to spaces' }
  }
}

/**
 * Update space availability schedule
 */
export async function updateSpaceAvailabilityScheduleAction(data: any): Promise<ActionResult<any>> {
  try {
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const schedule = await prisma.spaceAvailabilitySchedule.update({
      where: {
        id: data.id,
        space: { tenantId } // Ensure belongs to tenant
      },
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive,
      }
    })

    revalidatePath('/spaces')
    return { success: true, data: schedule }
  } catch (error: any) {
    console.error('Update space availability schedule error:', error)
    return { success: false, error: 'Failed to update availability schedule' }
  }
}

/**
 * Create space maintenance schedule
 */
export async function createSpaceMaintenanceScheduleAction(data: any): Promise<ActionResult<any>> {
  try {
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify space belongs to tenant
    const space = await prisma.space.findFirst({
      where: { id: data.spaceId, tenantId }
    })

    if (!space) {
      return { success: false, error: 'Space not found' }
    }

    const maintenance = await prisma.spaceMaintenanceSchedule.create({
      data: {
        spaceId: data.spaceId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        isRecurring: data.isRecurring ?? false,
        recurrence: data.recurrence ? JSON.stringify(data.recurrence) : null,
        createdBy: user.id,
      }
    })

    revalidatePath('/spaces')
    return { success: true, data: maintenance }
  } catch (error: any) {
    console.error('Create space maintenance schedule error:', error)
    return { success: false, error: 'Failed to create maintenance schedule' }
  }
}

/**
 * Perform check-in
 */
export async function performCheckInAction(data: any): Promise<ActionResult<any>> {
  try {
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify booking exists and belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: {
        id: data.bookingId,
        tenantId,
        space: { tenantId }
      },
      include: { space: true }
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    // Check if already checked in
    const existingCheckIn = await prisma.checkInOut.findFirst({
      where: {
        bookingId: data.bookingId,
        checkOutTime: null
      }
    })

    if (existingCheckIn) {
      return { success: false, error: 'Already checked in' }
    }

    const checkIn = await prisma.checkInOut.create({
      data: {
        tenantId,
        bookingId: data.bookingId,
        spaceId: booking.spaceId,
        userId: user.id,
        checkInMethod: data.checkInMethod,
        qrCode: data.qrCode,
        notes: data.notes,
      }
    })

    // Update booking status
    await prisma.booking.update({
      where: { id: data.bookingId },
      data: { status: 'CHECKED_IN' }
    })

    revalidatePath('/bookings')
    revalidatePath('/check-in')
    return { success: true, data: checkIn }
  } catch (error: any) {
    console.error('Perform check-in error:', error)
    return { success: false, error: 'Failed to perform check-in' }
  }
}

/**
 * Perform check-out
 */
export async function performCheckOutAction(data: any): Promise<ActionResult<any>> {
  try {
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const checkOut = await prisma.checkInOut.update({
      where: {
        id: data.checkInId,
        tenantId
      },
      data: {
        checkOutTime: new Date(),
        notes: data.notes,
      }
    })

    // Update booking status
    await prisma.booking.update({
      where: { id: checkOut.bookingId },
      data: { status: 'CHECKED_OUT' }
    })

    revalidatePath('/bookings')
    revalidatePath('/check-in')
    return { success: true, data: checkOut }
  } catch (error: any) {
    console.error('Perform check-out error:', error)
    return { success: false, error: 'Failed to perform check-out' }
  }
}

/**
 * Generate QR code for booking
 */
export async function generateBookingQRCodeAction(data: any): Promise<ActionResult<any>> {
  try {
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: data.bookingId,
        tenantId
      }
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    // Generate QR code data
    const qrData = {
      bookingId: data.bookingId,
      userId: user.id,
      tenantId,
      timestamp: Date.now(),
      expiresAt: Date.now() + (data.expiresInHours * 60 * 60 * 1000)
    }

    const QRCode = require('qrcode')
    const qrCodeString = await QRCode.toDataURL(JSON.stringify(qrData))

    return {
      success: true,
      data: {
        qrCode: qrCodeString,
        qrData
      }
    }
  } catch (error: any) {
    console.error('Generate QR code error:', error)
    return { success: false, error: 'Failed to generate QR code' }
  }
}

/**
 * Get space occupancy data
 */
export async function getSpaceOccupancyAction(data: any): Promise<ActionResult<any>> {
  try {
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    const occupancyData = await prisma.checkInOut.findMany({
      where: {
        tenantId,
        ...(data.spaceId && { spaceId: data.spaceId }),
        checkInTime: {
          gte: data.startDate,
          lte: data.endDate
        }
      },
      include: {
        space: { select: { name: true, capacity: true } },
        user: { select: { firstName: true, lastName: true } },
        booking: { select: { title: true, startTime: true, endTime: true } }
      },
      orderBy: { checkInTime: 'desc' }
    })

    return { success: true, data: occupancyData }
  } catch (error: any) {
    console.error('Get space occupancy error:', error)
    return { success: false, error: 'Failed to get occupancy data' }
  }
}

/**
 * Create recurring booking
 */
export async function createRecurringBookingAction(data: any): Promise<ActionResult<any>> {
  try {
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Create main booking
    const booking = await prisma.booking.create({
      data: {
        tenantId,
        spaceId: data.spaceId,
        userId: user.id,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        status: 'CONFIRMED'
      }
    })

    // Create recurrence if specified
    if (data.recurrence) {
      await prisma.bookingRecurrence.create({
        data: {
          bookingId: booking.id,
          pattern: data.recurrence.pattern,
          interval: data.recurrence.interval,
          daysOfWeek: data.recurrence.daysOfWeek ? JSON.stringify(data.recurrence.daysOfWeek) : null,
          dayOfMonth: data.recurrence.dayOfMonth,
          endDate: data.recurrence.endDate,
          occurrences: data.recurrence.occurrences,
          exceptions: data.recurrence.exceptions ? JSON.stringify(data.recurrence.exceptions) : null,
        }
      })
    }

    revalidatePath('/bookings')
    return { success: true, data: booking }
  } catch (error: any) {
    console.error('Create recurring booking error:', error)
    return { success: false, error: 'Failed to create recurring booking' }
  }
}