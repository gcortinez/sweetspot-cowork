/**
 * API compatibility layer for visitor check-in operations
 * Provides RESTful endpoints for visitor check-in/check-out
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  checkInVisitorAction,
  checkOutVisitorAction,
  type CheckInVisitorRequest,
  type CheckOutVisitorRequest
} from '@/lib/actions/visitor'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/v1/visitors/[id]/checkin
 * Check in a visitor
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    const result = await checkInVisitorAction({
      id: params.id,
      actualArrival: body.actualArrival ? new Date(body.actualArrival) : undefined,
      badgeNumber: body.badgeNumber,
      accessCardNumber: body.accessCardNumber,
      parkingSpot: body.parkingSpot,
      photoUrl: body.photoUrl,
      signatureUrl: body.signatureUrl,
      healthDeclaration: body.healthDeclaration,
      temperature: body.temperature,
      notes: body.notes,
    } as CheckInVisitorRequest)

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
    console.error('Check in visitor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/visitors/[id]/checkin
 * Check out a visitor (return)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    const result = await checkOutVisitorAction({
      id: params.id,
      actualDeparture: body.actualDeparture ? new Date(body.actualDeparture) : undefined,
      badgeReturned: body.badgeReturned,
      accessCardReturned: body.accessCardReturned,
      feedback: body.feedback,
      rating: body.rating,
      notes: body.notes,
    } as CheckOutVisitorRequest)

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
    console.error('Check out visitor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}