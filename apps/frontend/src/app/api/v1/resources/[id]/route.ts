/**
 * API compatibility layer for individual resource operations
 * Provides RESTful endpoints for resource CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getResourceAction,
  updateResourceAction,
  deleteResourceAction,
  type GetResourceRequest,
  type UpdateResourceRequest,
  type DeleteResourceRequest
} from '@/lib/actions/resource'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/v1/resources/[id]
 * Get a resource by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await getResourceAction({ id: params.id } as GetResourceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Resource not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Get resource API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/resources/[id]
 * Update a resource
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Convert string dates to Date objects if needed
    if (body.purchaseInfo?.purchaseDate) {
      body.purchaseInfo.purchaseDate = new Date(body.purchaseInfo.purchaseDate)
    }
    if (body.financialInfo?.lastValuationDate) {
      body.financialInfo.lastValuationDate = new Date(body.financialInfo.lastValuationDate)
    }
    if (body.maintenanceSchedule?.lastMaintenance) {
      body.maintenanceSchedule.lastMaintenance = new Date(body.maintenanceSchedule.lastMaintenance)
    }
    if (body.maintenanceSchedule?.nextMaintenance) {
      body.maintenanceSchedule.nextMaintenance = new Date(body.maintenanceSchedule.nextMaintenance)
    }
    if (body.specifications?.warrantyInfo?.expiryDate) {
      body.specifications.warrantyInfo.expiryDate = new Date(body.specifications.warrantyInfo.expiryDate)
    }

    const result = await updateResourceAction({
      id: params.id,
      ...body,
    } as UpdateResourceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Resource not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Update resource API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/resources/[id]
 * Delete a resource
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await deleteResourceAction({ id: params.id } as DeleteResourceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: result.error === 'Resource not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully',
    })
  } catch (error) {
    console.error('Delete resource API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}