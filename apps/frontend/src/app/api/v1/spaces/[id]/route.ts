/**
 * API compatibility layer for individual space operations
 * Provides RESTful endpoints for space CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getSpaceAction,
  updateSpaceAction,
  deleteSpaceAction,
  type GetSpaceRequest,
  type UpdateSpaceRequest,
  type DeleteSpaceRequest
} from '@/lib/actions/space'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/v1/spaces/[id]
 * Get a space by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await getSpaceAction({ id: params.id } as GetSpaceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Space not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Get space API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/spaces/[id]
 * Update a space
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Convert string dates to Date objects if needed
    if (body.availabilityRules) {
      body.availabilityRules = body.availabilityRules.map((rule: any) => ({
        ...rule,
        startTime: rule.startTime ? new Date(rule.startTime) : undefined,
        endTime: rule.endTime ? new Date(rule.endTime) : undefined,
        startDate: rule.startDate ? new Date(rule.startDate) : undefined,
        endDate: rule.endDate ? new Date(rule.endDate) : undefined,
      }))
    }

    const result = await updateSpaceAction({
      id: params.id,
      ...body,
    } as UpdateSpaceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Space not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Update space API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/spaces/[id]
 * Delete a space
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await deleteSpaceAction({ id: params.id } as DeleteSpaceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Space not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Space deleted successfully',
    })
  } catch (error) {
    console.error('Delete space API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}