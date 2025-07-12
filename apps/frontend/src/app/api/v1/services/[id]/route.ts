/**
 * API compatibility layer for individual service operations
 * Provides RESTful endpoints for service CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getServiceAction,
  updateServiceAction,
  deleteServiceAction,
  type GetServiceRequest,
  type UpdateServiceRequest,
  type DeleteServiceRequest
} from '@/lib/actions/service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/v1/services/[id]
 * Get a service by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await getServiceAction({ id: params.id } as GetServiceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Service not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Get service API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/services/[id]
 * Update a service
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Convert string dates to Date objects if needed
    if (body.availability?.timeSlots) {
      body.availability.timeSlots = body.availability.timeSlots.map((slot: any) => ({
        ...slot,
        startTime: slot.startTime ? new Date(slot.startTime) : undefined,
        endTime: slot.endTime ? new Date(slot.endTime) : undefined,
      }))
    }

    const result = await updateServiceAction({
      id: params.id,
      ...body,
    } as UpdateServiceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Service not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Update service API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/services/[id]
 * Delete a service
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await deleteServiceAction({ id: params.id } as DeleteServiceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Service not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    })
  } catch (error) {
    console.error('Delete service API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}