import { NextRequest, NextResponse } from 'next/server'
import { createTenantAction, listTenantsAction, getTenantStatsAction } from '@/lib/actions/tenant'

/**
 * API Route Compatibility Layer for Tenant Management
 * Provides backward compatibility with existing API endpoints
 */

// Create new tenant (POST /api/tenants)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the Server Action
    const result = await createTenantAction(body)
    
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
      tenant: result.tenant,
      message: result.message,
    }, { status: 201 })
    
  } catch (error) {
    console.error('API create tenant error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// List tenants (GET /api/tenants)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc',
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      hasCustomDomain: searchParams.get('hasCustomDomain') ? 
        searchParams.get('hasCustomDomain') === 'true' : undefined,
      createdAfter: searchParams.get('createdAfter') || undefined,
      createdBefore: searchParams.get('createdBefore') || undefined,
    }

    // Call the Server Action
    const result = await listTenantsAction(query)
    
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
      tenants: result.tenants,
      pagination: result.pagination,
    })
    
  } catch (error) {
    console.error('API list tenants error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}