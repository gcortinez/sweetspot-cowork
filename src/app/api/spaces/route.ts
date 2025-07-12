import { NextRequest, NextResponse } from 'next/server'
import { createSpaceAction, listSpacesAction } from '@/lib/actions/space'

// List spaces (GET /api/spaces)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      type: searchParams.get('type') as any || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      minCapacity: searchParams.get('minCapacity') ? parseInt(searchParams.get('minCapacity')!) : undefined,
      maxCapacity: searchParams.get('maxCapacity') ? parseInt(searchParams.get('maxCapacity')!) : undefined,
      hasAmenities: searchParams.get('hasAmenities')?.split(',').filter(Boolean) || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') as any || 'name',
      sortOrder: searchParams.get('sortOrder') as any || 'asc',
    }

    const result = await listSpacesAction(filters)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.fieldErrors && { fieldErrors: result.fieldErrors }),
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      spaces: result.data?.spaces,
      pagination: result.data?.pagination,
    })
    
  } catch (error) {
    console.error('API spaces list error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Create space (POST /api/spaces)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the Server Action
    const result = await createSpaceAction(body)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.fieldErrors && { fieldErrors: result.fieldErrors }),
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      space: result.data,
    }, { status: 201 })
    
  } catch (error) {
    console.error('API space creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}