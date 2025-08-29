import { NextRequest, NextResponse } from 'next/server'
import { getBookingAction, updateBookingAction, cancelBookingAction } from '@/lib/actions/booking'

// Get booking by ID (GET /api/bookings/[id])
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getBookingAction(id)
    
    if (!result.success) {
      const status = result.error === 'Booking not found' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      booking: result.data,
    })
    
  } catch (error) {
    console.error('API booking retrieval error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Update booking (PUT /api/bookings/[id])
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Convert date strings to Date objects
    if (body.startTime) {
      body.startTime = new Date(body.startTime)
    }
    if (body.endTime) {
      body.endTime = new Date(body.endTime)
    }
    
    const result = await updateBookingAction(id, body)
    
    if (!result.success) {
      const status = result.error === 'Booking not found' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.fieldErrors && { fieldErrors: result.fieldErrors }),
          ...(result.details && { details: result.details }),
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      booking: result.data,
    })
    
  } catch (error) {
    console.error('API booking update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Cancel booking (DELETE /api/bookings/[id])
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const reason = searchParams.get('reason') || undefined
    
    const result = await cancelBookingAction(id, reason)
    
    if (!result.success) {
      const status = result.error === 'Booking not found' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    })
    
  } catch (error) {
    console.error('API booking cancellation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}