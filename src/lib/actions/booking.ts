'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/auth'
import type { ActionResult } from '@/types/database'
import {
  createBookingSchema,
  updateBookingSchema,
  deleteBookingSchema,
  getBookingSchema,
  listBookingsSchema,
  checkBookingConflictsSchema,
  checkInBookingSchema,
  checkOutBookingSchema,
  approveBookingSchema,
  modifyBookingSchema,
  bulkUpdateBookingsSchema,
  getBookingStatsSchema,
  getBookingUtilizationSchema,
  generateRecurringBookingsSchema,
  type CreateBookingRequest,
  type UpdateBookingRequest,
  type DeleteBookingRequest,
  type GetBookingRequest,
  type ListBookingsRequest,
  type CheckBookingConflictsRequest,
  type CheckInBookingRequest,
  type CheckOutBookingRequest,
  type ApproveBookingRequest,
  type ModifyBookingRequest,
  type BulkUpdateBookingsRequest,
  type GetBookingStatsRequest,
  type GetBookingUtilizationRequest,
  type GenerateRecurringBookingsRequest,
} from '@/lib/validations/booking'
import { PricingCalculator } from '@/lib/utils/pricing'

/**
 * Create a new booking
 */
export async function createBookingAction(data: CreateBookingRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = createBookingSchema.parse(data)

    // Verify space exists if specified
    if (validatedData.spaceId) {
      const space = await prisma.space.findFirst({
        where: {
          id: validatedData.spaceId,
          tenantId,
          isActive: true,
        },
      })

      if (!space) {
        return { success: false, error: 'Space not found or not available' }
      }

      // Check for conflicts
      const conflicts = await checkBookingConflictsInternal(
        validatedData.spaceId,
        validatedData.startTime,
        validatedData.endTime,
        tenantId
      )

      if (conflicts.length > 0) {
        return { 
          success: false, 
          error: 'Booking conflicts with existing reservation',
          details: { conflicts }
        }
      }
    }

    // Verify user exists
    const bookingUser = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        tenantId,
      },
    })

    if (!bookingUser) {
      return { success: false, error: 'User not found' }
    }

    // Verify services exist if specified
    if (validatedData.services && validatedData.services.length > 0) {
      const serviceIds = validatedData.services.map(s => s.serviceId)
      const existingServices = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          tenantId,
          isActive: true,
          isBookable: true,
        },
        select: { id: true },
      })

      if (existingServices.length !== serviceIds.length) {
        return { success: false, error: 'One or more services not found or not bookable' }
      }
    }

    // Calculate total amount if not provided
    let totalAmount = validatedData.totalAmount
    if (totalAmount === 0 && (validatedData.spaceId || validatedData.services?.length)) {
      // This would integrate with pricing calculator
      // For now, we'll use a simple calculation
      totalAmount = 100 // Placeholder
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        tenantId,
        spaceId: validatedData.spaceId!,
        userId: validatedData.userId,
        title: validatedData.title,
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        status: validatedData.status,
        cost: totalAmount,
      },
      include: {
        tenant: true,
        space: true,
        user: true,
      },
    })

    // Create booking service records if services are specified
    if (validatedData.services && validatedData.services.length > 0) {
      const bookingServices = validatedData.services.map(service => ({
        bookingId: booking.id,
        serviceId: service.serviceId,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        totalPrice: service.totalPrice,
        status: service.status,
        notes: service.notes,
        startTime: service.startTime,
        endTime: service.endTime,
        metadata: service.metadata ? JSON.stringify(service.metadata) : null,
      }))

      await prisma.bookingService.createMany({
        data: bookingServices,
      })
    }

    revalidatePath('/bookings')
    
    return { 
      success: true, 
      data: {
        ...booking,
        participants: booking.participants ? JSON.parse(booking.participants) : [],
        services: booking.services ? JSON.parse(booking.services) : [],
        recurrenceRule: booking.recurrenceRule ? JSON.parse(booking.recurrenceRule) : null,
        metadata: booking.metadata ? JSON.parse(booking.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create booking error:', error)
    
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

    return { success: false, error: 'Failed to create booking' }
  }
}

/**
 * Update an existing booking
 */
export async function updateBookingAction(data: UpdateBookingRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = updateBookingSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!existingBooking) {
      return { success: false, error: 'Booking not found' }
    }

    // Check if booking can be modified
    if (existingBooking.status === 'COMPLETED' || existingBooking.status === 'CANCELLED') {
      return { success: false, error: 'Cannot modify completed or cancelled booking' }
    }

    // Verify space exists if being updated
    if (updateData.spaceId && updateData.spaceId !== existingBooking.spaceId) {
      const space = await prisma.space.findFirst({
        where: {
          id: updateData.spaceId,
          tenantId,
          isActive: true,
        },
      })

      if (!space) {
        return { success: false, error: 'Space not found or not available' }
      }
    }

    // Check for conflicts if time or space is being changed
    if ((updateData.startTime || updateData.endTime || updateData.spaceId) && 
        (updateData.spaceId || existingBooking.spaceId)) {
      const spaceId = updateData.spaceId || existingBooking.spaceId
      const startTime = updateData.startTime || existingBooking.startTime
      const endTime = updateData.endTime || existingBooking.endTime

      if (spaceId) {
        const conflicts = await checkBookingConflictsInternal(
          spaceId,
          startTime,
          endTime,
          tenantId,
          id // Exclude current booking
        )

        if (conflicts.length > 0) {
          return { 
            success: false, 
            error: 'Booking conflicts with existing reservation',
            details: { conflicts }
          }
        }
      }
    }

    // Prepare update data with JSON stringification
    const processedUpdateData: any = { ...updateData }
    if (updateData.participants) {
      processedUpdateData.participants = JSON.stringify(updateData.participants)
    }
    if (updateData.services) {
      processedUpdateData.services = JSON.stringify(updateData.services)
    }
    if (updateData.recurrenceRule) {
      processedUpdateData.recurrenceRule = JSON.stringify(updateData.recurrenceRule)
    }
    if (updateData.metadata) {
      processedUpdateData.metadata = JSON.stringify(updateData.metadata)
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: processedUpdateData,
      include: {
        tenant: true,
        space: true,
        user: true,
      },
    })

    revalidatePath('/bookings')
    revalidatePath(`/bookings/${id}`)
    
    return { 
      success: true, 
      data: {
        ...booking,
        participants: booking.participants ? JSON.parse(booking.participants) : [],
        services: booking.services ? JSON.parse(booking.services) : [],
        recurrenceRule: booking.recurrenceRule ? JSON.parse(booking.recurrenceRule) : null,
        metadata: booking.metadata ? JSON.parse(booking.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Update booking error:', error)
    
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

    return { success: false, error: 'Failed to update booking' }
  }
}

/**
 * Cancel/delete a booking
 */
export async function deleteBookingAction(data: DeleteBookingRequest): Promise<ActionResult<void>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = deleteBookingSchema.parse(data)

    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingBooking) {
      return { success: false, error: 'Booking not found' }
    }

    // Update booking status to cancelled instead of deleting
    await prisma.booking.update({
      where: { id: validatedData.id },
      data: { 
        status: 'CANCELLED',
        cancellationReason: validatedData.reason,
        cancellationNotes: validatedData.notes,
        cancelledAt: new Date(),
        cancelledBy: user.id,
      },
    })

    // Update associated booking services to cancelled
    await prisma.bookingService.updateMany({
      where: { bookingId: validatedData.id },
      data: { status: 'CANCELLED' },
    })

    revalidatePath('/bookings')
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete booking error:', error)
    
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

    return { success: false, error: 'Failed to cancel booking' }
  }
}

/**
 * Get a booking by ID
 */
export async function getBookingAction(data: GetBookingRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = getBookingSchema.parse(data)

    // Get booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        tenant: true,
        space: true,
        user: true,
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    // Get associated booking services
    const bookingServices = await prisma.bookingService.findMany({
      where: { bookingId: booking.id },
      include: {
        service: true,
      },
    })
    
    return { 
      success: true, 
      data: {
        ...booking,
        participants: booking.participants ? JSON.parse(booking.participants) : [],
        services: booking.services ? JSON.parse(booking.services) : [],
        recurrenceRule: booking.recurrenceRule ? JSON.parse(booking.recurrenceRule) : null,
        metadata: booking.metadata ? JSON.parse(booking.metadata) : null,
        bookingServices,
      }
    }
  } catch (error: any) {
    console.error('Get booking error:', error)
    
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

    return { success: false, error: 'Failed to get booking' }
  }
}

/**
 * List bookings with filtering and pagination
 */
export async function listBookingsAction(data: ListBookingsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = listBookingsSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.search) {
      where.OR = [
        { title: { contains: validatedData.search, mode: 'insensitive' } },
        { description: { contains: validatedData.search, mode: 'insensitive' } },
      ]
    }

    if (validatedData.spaceId) {
      where.spaceId = validatedData.spaceId
    }

    if (validatedData.userId) {
      where.userId = validatedData.userId
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    if (validatedData.startDate) {
      where.startTime = { ...where.startTime, gte: validatedData.startDate }
    }

    if (validatedData.endDate) {
      where.endTime = { ...where.endTime, lte: validatedData.endDate }
    }

    if (validatedData.isRecurring !== undefined) {
      where.isRecurring = validatedData.isRecurring
    }

    if (validatedData.requiresApproval !== undefined) {
      where.requiresApproval = validatedData.requiresApproval
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.booking.count({ where })

    // Get bookings
    const bookings = await prisma.booking.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
        space: true,
        user: true,
        approval: true,
      },
    })

    // Process JSON fields
    const processedBookings = bookings.map(booking => ({
      ...booking,
      participants: booking.participants ? JSON.parse(booking.participants) : [],
      services: booking.services ? JSON.parse(booking.services) : [],
      recurrenceRule: booking.recurrenceRule ? JSON.parse(booking.recurrenceRule) : null,
      metadata: booking.metadata ? JSON.parse(booking.metadata) : null,
    }))
    
    return { 
      success: true, 
      data: {
        bookings: processedBookings,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List bookings error:', error)
    
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

    return { success: false, error: 'Failed to list bookings' }
  }
}

/**
 * Check for booking conflicts
 */
export async function checkBookingConflictsAction(data: CheckBookingConflictsRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId } = await getTenantContext()
    if (!tenantId) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = checkBookingConflictsSchema.parse(data)

    const conflicts = await checkBookingConflictsInternal(
      validatedData.spaceId,
      validatedData.startTime,
      validatedData.endTime,
      tenantId,
      validatedData.excludeBookingId
    )

    return { 
      success: true, 
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
      }
    }
  } catch (error: any) {
    console.error('Check booking conflicts error:', error)
    
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

    return { success: false, error: 'Failed to check booking conflicts' }
  }
}

/**
 * Check in a booking
 */
export async function checkInBookingAction(data: CheckInBookingRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = checkInBookingSchema.parse(data)

    // Get booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    if (booking.status !== 'CONFIRMED') {
      return { success: false, error: 'Booking must be confirmed before check-in' }
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: validatedData.id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: validatedData.actualStartTime || new Date(),
      },
    })

    // Update participant check-in status if specified
    if (validatedData.participantIds && validatedData.participantIds.length > 0) {
      const participants = booking.participants ? JSON.parse(booking.participants) : []
      const updatedParticipants = participants.map((participant: any) => {
        if (validatedData.participantIds!.includes(participant.userId)) {
          return {
            ...participant,
            hasCheckedIn: true,
            checkedInAt: new Date(),
          }
        }
        return participant
      })

      await prisma.booking.update({
        where: { id: validatedData.id },
        data: {
          participants: JSON.stringify(updatedParticipants),
        },
      })
    }

    revalidatePath('/bookings')
    revalidatePath(`/bookings/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...updatedBooking,
        participants: updatedBooking.participants ? JSON.parse(updatedBooking.participants) : [],
        services: updatedBooking.services ? JSON.parse(updatedBooking.services) : [],
        recurrenceRule: updatedBooking.recurrenceRule ? JSON.parse(updatedBooking.recurrenceRule) : null,
        metadata: updatedBooking.metadata ? JSON.parse(updatedBooking.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Check in booking error:', error)
    
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

    return { success: false, error: 'Failed to check in booking' }
  }
}

/**
 * Check out a booking
 */
export async function checkOutBookingAction(data: CheckOutBookingRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = checkOutBookingSchema.parse(data)

    // Get booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    if (booking.status !== 'CHECKED_IN') {
      return { success: false, error: 'Booking must be checked in before check-out' }
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: validatedData.id },
      data: {
        status: 'COMPLETED',
        checkedOutAt: validatedData.actualEndTime || new Date(),
        // Store feedback in metadata if provided
        metadata: validatedData.feedback || validatedData.feedbackRating ? JSON.stringify({
          ...(booking.metadata ? JSON.parse(booking.metadata) : {}),
          feedback: validatedData.feedback,
          feedbackRating: validatedData.feedbackRating,
        }) : booking.metadata,
      },
    })

    revalidatePath('/bookings')
    revalidatePath(`/bookings/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...updatedBooking,
        participants: updatedBooking.participants ? JSON.parse(updatedBooking.participants) : [],
        services: updatedBooking.services ? JSON.parse(updatedBooking.services) : [],
        recurrenceRule: updatedBooking.recurrenceRule ? JSON.parse(updatedBooking.recurrenceRule) : null,
        metadata: updatedBooking.metadata ? JSON.parse(updatedBooking.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Check out booking error:', error)
    
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

    return { success: false, error: 'Failed to check out booking' }
  }
}

/**
 * Approve or reject a booking
 */
export async function approveBookingAction(data: ApproveBookingRequest): Promise<ActionResult<any>> {
  try {
    // Get tenant context and validate auth
    const { tenantId, user } = await getTenantContext()
    if (!tenantId || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate input data
    const validatedData = approveBookingSchema.parse(data)

    // Get booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    if (!booking.requiresApproval) {
      return { success: false, error: 'Booking does not require approval' }
    }

    if (booking.status !== 'PENDING') {
      return { success: false, error: 'Only pending bookings can be approved or rejected' }
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.approved ? 'CONFIRMED' : 'CANCELLED',
        approvedBy: user.id,
        approvedAt: new Date(),
        cancellationReason: validatedData.approved ? null : 'ADMIN_REJECTED',
        cancellationNotes: validatedData.approved ? null : validatedData.notes,
      },
    })

    revalidatePath('/bookings')
    revalidatePath(`/bookings/${validatedData.id}`)
    
    return { 
      success: true, 
      data: {
        ...updatedBooking,
        participants: updatedBooking.participants ? JSON.parse(updatedBooking.participants) : [],
        services: updatedBooking.services ? JSON.parse(updatedBooking.services) : [],
        recurrenceRule: updatedBooking.recurrenceRule ? JSON.parse(updatedBooking.recurrenceRule) : null,
        metadata: updatedBooking.metadata ? JSON.parse(updatedBooking.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Approve booking error:', error)
    
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

    return { success: false, error: 'Failed to approve booking' }
  }
}

/**
 * Internal helper function to check booking conflicts
 */
async function checkBookingConflictsInternal(
  spaceId: string,
  startTime: Date,
  endTime: Date,
  tenantId: string,
  excludeBookingId?: string
): Promise<any[]> {
  const conflictWhere: any = {
    spaceId,
    space: { tenantId },
    status: {
      in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'],
    },
    OR: [
      {
        AND: [
          { startTime: { lte: startTime } },
          { endTime: { gt: startTime } },
        ],
      },
      {
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gte: endTime } },
        ],
      },
      {
        AND: [
          { startTime: { gte: startTime } },
          { endTime: { lte: endTime } },
        ],
      },
    ],
  }

  if (excludeBookingId) {
    conflictWhere.id = { not: excludeBookingId }
  }

  return await prisma.booking.findMany({
    where: conflictWhere,
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      status: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}