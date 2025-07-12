/**
 * API compatibility layer for resources
 * Provides RESTful endpoints that use Server Actions internally
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createResourceAction, 
  listResourcesAction,
  type CreateResourceRequest,
  type ListResourcesRequest
} from '@/lib/actions/resource'

/**
 * GET /api/v1/resources
 * List resources with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const params: ListResourcesRequest = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      condition: searchParams.get('condition') as any || undefined,
      spaceId: searchParams.get('spaceId') || undefined,
      isBookable: searchParams.get('isBookable') ? searchParams.get('isBookable') === 'true' : undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      sortBy: searchParams.get('sortBy') as any || 'name',
      sortOrder: searchParams.get('sortOrder') as any || 'asc',
    }

    const result = await listResourcesAction(params)

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
    console.error('List resources API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/resources
 * Create a new resource
 */
export async function POST(request: NextRequest) {
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

    const result = await createResourceAction(body as CreateResourceRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    }, { status: 201 })
  } catch (error) {
    console.error('Create resource API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}