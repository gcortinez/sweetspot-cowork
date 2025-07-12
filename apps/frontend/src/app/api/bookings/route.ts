import { NextRequest, NextResponse } from 'next/server'
import { createBookingAction, listBookingsAction } from '@/lib/actions/booking'

// List bookings (GET /api/bookings)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      spaceId: searchParams.get('spaceId') || undefined,
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') as any || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      search: searchParams.get('search') || undefined,
      requiresApproval: searchParams.get('requiresApproval') ? searchParams.get('requiresApproval') === 'true' : undefined,
      approvalStatus: searchParams.get('approvalStatus') as any || undefined,
      includeRecurring: searchParams.get('includeRecurring') !== 'false',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') as any || 'startTime',
      sortOrder: searchParams.get('sortOrder') as any || 'asc',
    }

    const result = await listBookingsAction(filters)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.fieldErrors && { fieldErrors: result.fieldErrors }),
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      bookings: result.data?.bookings,
      pagination: result.data?.pagination,
    })
    
  } catch (error) {
    console.error('API bookings list error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Create booking (POST /api/bookings)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert date strings to Date objects
    if (body.startTime) {
      body.startTime = new Date(body.startTime)
    }
    if (body.endTime) {
      body.endTime = new Date(body.endTime)
    }
    if (body.recurrence?.endDate) {
      body.recurrence.endDate = new Date(body.recurrence.endDate)
    }
    
    // Call the Server Action
    const result = await createBookingAction(body)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.fieldErrors && { fieldErrors: result.fieldErrors }),
          ...(result.details && { details: result.details }),
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      bookings: result.data?.bookings,
      isRecurring: result.data?.isRecurring,
      requiresApproval: result.data?.requiresApproval,
    }, { status: 201 })
    
  } catch (error) {
    console.error('API booking creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}