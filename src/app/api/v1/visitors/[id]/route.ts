/**
 * API compatibility layer for individual visitor operations
 * Provides RESTful endpoints for visitor CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getVisitorAction,
  updateVisitorAction,
  deleteVisitorAction,
  type GetVisitorRequest,
  type UpdateVisitorRequest,
  type DeleteVisitorRequest
} from '@/lib/actions/visitor'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/v1/visitors/[id]
 * Get a visitor by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await getVisitorAction({ id: params.id } as GetVisitorRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Visitor not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Get visitor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/visitors/[id]
 * Update a visitor
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Convert string dates to Date objects
    const updateData: any = { id: params.id, ...body }
    
    if (body.expectedArrival) {
      updateData.expectedArrival = new Date(body.expectedArrival)
    }
    if (body.expectedDeparture) {
      updateData.expectedDeparture = new Date(body.expectedDeparture)
    }
    if (body.actualArrival) {
      updateData.actualArrival = new Date(body.actualArrival)
    }
    if (body.actualDeparture) {
      updateData.actualDeparture = new Date(body.actualDeparture)
    }
    if (body.preRegistrationExpiresAt) {
      updateData.preRegistrationExpiresAt = new Date(body.preRegistrationExpiresAt)
    }
    if (body.blacklistedAt) {
      updateData.blacklistedAt = new Date(body.blacklistedAt)
    }
    if (body.recurrenceRule?.endDate) {
      updateData.recurrenceRule = {
        ...body.recurrenceRule,
        endDate: new Date(body.recurrenceRule.endDate),
      }
    }
    if (body.idVerification) {
      updateData.idVerification = {
        ...body.idVerification,
        expiryDate: body.idVerification.expiryDate ? new Date(body.idVerification.expiryDate) : undefined,
        verifiedAt: body.idVerification.verifiedAt ? new Date(body.idVerification.verifiedAt) : undefined,
      }
    }

    const result = await updateVisitorAction(updateData as UpdateVisitorRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Visitor not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Update visitor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/visitors/[id]
 * Cancel a visitor
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await deleteVisitorAction({ id: params.id } as DeleteVisitorRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Visitor not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Visitor cancelled successfully',
    })
  } catch (error) {
    console.error('Delete visitor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}