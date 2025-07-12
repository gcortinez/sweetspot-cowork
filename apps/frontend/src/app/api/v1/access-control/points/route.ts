/**
 * API compatibility layer for access points
 * Provides RESTful endpoints that use Server Actions internally
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createAccessPointAction, 
  listAccessPointsAction,
  type CreateAccessPointRequest,
  type ListAccessPointsRequest
} from '@/lib/actions/access-control'

/**
 * GET /api/v1/access-control/points
 * List access points with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const params: ListAccessPointsRequest = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      building: searchParams.get('building') || undefined,
      floor: searchParams.get('floor') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      sortBy: searchParams.get('sortBy') as any || 'name',
      sortOrder: searchParams.get('sortOrder') as any || 'asc',
    }

    const result = await listAccessPointsAction(params)

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
    console.error('List access points API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/access-control/points
 * Create a new access point
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert string dates to Date objects if needed
    const pointData = {
      ...body,
      hardware: body.hardware ? {
        ...body.hardware,
        installDate: body.hardware.installDate ? new Date(body.hardware.installDate) : undefined,
      } : undefined,
      maintenanceSchedule: body.maintenanceSchedule ? {
        ...body.maintenanceSchedule,
        lastMaintenance: body.maintenanceSchedule.lastMaintenance ? new Date(body.maintenanceSchedule.lastMaintenance) : undefined,
        nextMaintenance: body.maintenanceSchedule.nextMaintenance ? new Date(body.maintenanceSchedule.nextMaintenance) : undefined,
      } : undefined,
      currentState: body.currentState ? {
        ...body.currentState,
        lastStatusChange: body.currentState.lastStatusChange ? new Date(body.currentState.lastStatusChange) : undefined,
      } : undefined,
    }

    const result = await createAccessPointAction(pointData as CreateAccessPointRequest)

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
    console.error('Create access point API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}