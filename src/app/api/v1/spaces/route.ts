/**
 * API compatibility layer for spaces
 * Provides RESTful endpoints that use Server Actions internally
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createSpaceAction, 
  listSpacesAction,
  type CreateSpaceRequest,
  type ListSpacesRequest
} from '@/lib/actions/space'

/**
 * GET /api/v1/spaces
 * List spaces with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const params: ListSpacesRequest = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      capacity: searchParams.get('capacity') ? parseInt(searchParams.get('capacity')!) : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      isBookable: searchParams.get('isBookable') ? searchParams.get('isBookable') === 'true' : undefined,
      sortBy: searchParams.get('sortBy') as any || 'name',
      sortOrder: searchParams.get('sortOrder') as any || 'asc',
    }

    const result = await listSpacesAction(params)

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
    console.error('List spaces API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/spaces
 * Create a new space
 */
export async function POST(request: NextRequest) {
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

    const result = await createSpaceAction(body as CreateSpaceRequest)

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
    console.error('Create space API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}