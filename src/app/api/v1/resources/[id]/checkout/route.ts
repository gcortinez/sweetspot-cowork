/**
 * API compatibility layer for resource checkout operations
 * Provides RESTful endpoints for resource check-in/check-out
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  checkoutResourceAction,
  checkinResourceAction,
  type CheckoutResourceRequest,
  type CheckinResourceRequest
} from '@/lib/actions/resource'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/v1/resources/[id]/checkout
 * Check out a resource
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    const result = await checkoutResourceAction({
      resourceId: params.id,
      userId: body.userId,
      bookingId: body.bookingId,
      expectedReturnAt: body.expectedReturnAt ? new Date(body.expectedReturnAt) : undefined,
      notes: body.notes,
      checkedOutCondition: body.checkedOutCondition || 'GOOD',
    } as CheckoutResourceRequest)

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
    console.error('Checkout resource API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/resources/[id]/checkout
 * Check in a resource (return)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    const result = await checkinResourceAction({
      resourceId: params.id,
      checkedInCondition: body.checkedInCondition,
      notes: body.notes,
      damageReport: body.damageReport,
    } as CheckinResourceRequest)

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
    console.error('Checkin resource API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}