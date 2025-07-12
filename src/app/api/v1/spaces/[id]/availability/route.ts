/**
 * API compatibility layer for space availability checking
 * Provides RESTful endpoints for availability operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  checkSpaceAvailabilityAction,
  type CheckSpaceAvailabilityRequest
} from '@/lib/actions/space'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/v1/spaces/[id]/availability
 * Check space availability for a time period
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    const result = await checkSpaceAvailabilityAction({
      spaceId: params.id,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      excludeBookingId: body.excludeBookingId,
    } as CheckSpaceAvailabilityRequest)

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
    console.error('Check space availability API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/spaces/[id]/availability
 * Get space availability for a date range (query params)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const excludeBookingId = searchParams.get('excludeBookingId')

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'startTime and endTime are required' },
        { status: 400 }
      )
    }
    
    const result = await checkSpaceAvailabilityAction({
      spaceId: params.id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      excludeBookingId: excludeBookingId || undefined,
    } as CheckSpaceAvailabilityRequest)

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
    console.error('Get space availability API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}