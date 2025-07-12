import { NextRequest, NextResponse } from 'next/server'
import { checkAvailabilityAction } from '@/lib/actions/booking'

// Check booking availability (POST /api/bookings/check-availability)
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
    
    // Call the Server Action
    const result = await checkAvailabilityAction(body)
    
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
      ...result.data,
    })
    
  } catch (error) {
    console.error('API availability check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Check availability via GET with query parameters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const spaceId = searchParams.get('spaceId')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const excludeBookingId = searchParams.get('excludeBookingId') || undefined
    
    if (!spaceId || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'spaceId, startTime, and endTime are required',
        },
        { status: 400 }
      )
    }
    
    const data = {
      spaceId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      excludeBookingId,
    }
    
    // Call the Server Action
    const result = await checkAvailabilityAction(data)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      ...result.data,
    })
    
  } catch (error) {
    console.error('API availability check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}