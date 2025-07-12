/**
 * API compatibility layer for bookings
 * Provides RESTful endpoints that use Server Actions internally
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createBookingAction, 
  listBookingsAction,
  type CreateBookingRequest,
  type ListBookingsRequest
} from '@/lib/actions/booking'

/**
 * GET /api/v1/bookings
 * List bookings with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const params: ListBookingsRequest = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      spaceId: searchParams.get('spaceId') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      status: searchParams.get('status') as any || undefined,
      type: searchParams.get('type') as any || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      isRecurring: searchParams.get('isRecurring') ? searchParams.get('isRecurring') === 'true' : undefined,
      requiresApproval: searchParams.get('requiresApproval') ? searchParams.get('requiresApproval') === 'true' : undefined,
      sortBy: searchParams.get('sortBy') as any || 'startTime',
      sortOrder: searchParams.get('sortOrder') as any || 'asc',
    }

    const result = await listBookingsAction(params)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('List bookings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/bookings
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert string dates to Date objects
    const bookingData = {
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      services: body.services?.map((service: any) => ({
        ...service,
        startTime: service.startTime ? new Date(service.startTime) : undefined,
        endTime: service.endTime ? new Date(service.endTime) : undefined,
      })),
      recurrenceRule: body.recurrenceRule ? {
        ...body.recurrenceRule,
        startDate: body.recurrenceRule.startDate ? new Date(body.recurrenceRule.startDate) : undefined,
        endDate: body.recurrenceRule.endDate ? new Date(body.recurrenceRule.endDate) : undefined,
      } : undefined,
    }

    const result = await createBookingAction(bookingData as CreateBookingRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    }, { status: 201 })
  } catch (error) {
    console.error('Create booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}