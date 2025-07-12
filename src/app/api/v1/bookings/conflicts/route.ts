/**
 * API compatibility layer for booking conflict checking
 * Provides RESTful endpoints for conflict detection
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  checkBookingConflictsAction,
  type CheckBookingConflictsRequest
} from '@/lib/actions/booking'

/**
 * POST /api/v1/bookings/conflicts
 * Check for booking conflicts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await checkBookingConflictsAction({
      spaceId: body.spaceId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      excludeBookingId: body.excludeBookingId,
    } as CheckBookingConflictsRequest)

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
    console.error('Check booking conflicts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/bookings/conflicts
 * Check for booking conflicts (query params)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const spaceId = searchParams.get('spaceId')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const excludeBookingId = searchParams.get('excludeBookingId')

    if (!spaceId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'spaceId, startTime, and endTime are required' },
        { status: 400 }
      )
    }
    
    const result = await checkBookingConflictsAction({
      spaceId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      excludeBookingId: excludeBookingId || undefined,
    } as CheckBookingConflictsRequest)

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
    console.error('Get booking conflicts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}