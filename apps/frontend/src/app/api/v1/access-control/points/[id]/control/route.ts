/**
 * API compatibility layer for access point control operations
 * Provides RESTful endpoints for controlling access points
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  controlAccessPointAction,
  grantAccessAction,
  type ControlAccessPointRequest,
  type GrantAccessRequest
} from '@/lib/actions/access-control'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/v1/access-control/points/[id]/control
 * Control an access point (lock, unlock, etc.)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    const result = await controlAccessPointAction({
      id: params.id,
      action: body.action,
      duration: body.duration,
      reason: body.reason,
    } as ControlAccessPointRequest)

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
    console.error('Control access point API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/access-control/points/[id]/control
 * Grant temporary access to a user or visitor
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    const result = await grantAccessAction({
      accessPointId: params.id,
      userId: body.userId,
      visitorId: body.visitorId,
      duration: body.duration || 5,
      reason: body.reason,
      override: body.override || false,
    } as GrantAccessRequest)

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
    console.error('Grant access API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}