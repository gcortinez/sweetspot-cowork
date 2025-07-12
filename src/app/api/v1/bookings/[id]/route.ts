/**
 * API compatibility layer for individual booking operations
 * Provides RESTful endpoints for booking CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getBookingAction,
  updateBookingAction,
  deleteBookingAction,
  type GetBookingRequest,
  type UpdateBookingRequest,
  type DeleteBookingRequest
} from '@/lib/actions/booking'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/v1/bookings/[id]
 * Get a booking by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await getBookingAction({ id: params.id } as GetBookingRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Booking not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Get booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/bookings/[id]
 * Update a booking
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Convert string dates to Date objects
    const updateData: any = { id: params.id, ...body }
    
    if (body.startTime) {
      updateData.startTime = new Date(body.startTime)
    }
    if (body.endTime) {
      updateData.endTime = new Date(body.endTime)
    }
    if (body.services) {
      updateData.services = body.services.map((service: any) => ({
        ...service,
        startTime: service.startTime ? new Date(service.startTime) : undefined,
        endTime: service.endTime ? new Date(service.endTime) : undefined,
      }))
    }
    if (body.recurrenceRule) {
      updateData.recurrenceRule = {
        ...body.recurrenceRule,
        startDate: body.recurrenceRule.startDate ? new Date(body.recurrenceRule.startDate) : undefined,
        endDate: body.recurrenceRule.endDate ? new Date(body.recurrenceRule.endDate) : undefined,
      }
    }

    const result = await updateBookingAction(updateData as UpdateBookingRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Booking not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Update booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/bookings/[id]
 * Cancel a booking
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json().catch(() => ({}))
    
    const result = await deleteBookingAction({
      id: params.id,
      reason: body.reason || 'API_CANCELLATION',
      notes: body.notes,
    } as DeleteBookingRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Booking not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    })
  } catch (error) {
    console.error('Delete booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}