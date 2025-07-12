import { NextRequest, NextResponse } from 'next/server'
import { createUserAction, listUsersAction, getUserStatsAction, bulkUserOperationAction } from '@/lib/actions/user'

// Handle bulk operations
async function handleBulkOperation(body: any) {
  try {
    const result = await bulkUserOperationAction(body)
    
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
      affectedCount: result.affectedCount,
      message: result.message,
    })
    
  } catch (error) {
    console.error('API bulk user operation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Create new user (POST /api/users)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if this is a bulk operation
    if (body.operation && body.userIds) {
      return handleBulkOperation(body)
    }
    
    // Call the Server Action for user creation
    const result = await createUserAction(body)
    
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
      user: result.user,
      ...(result.temporaryPassword && { temporaryPassword: result.temporaryPassword }),
      message: result.message,
    }, { status: 201 })
    
  } catch (error) {
    console.error('API create user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// List users (GET /api/users)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Check if requesting stats
    if (searchParams.get('stats') === 'true') {
      const result = await getUserStatsAction()
      
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        stats: result.stats,
      })
    }
    
    const query = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      createdAfter: searchParams.get('createdAfter') || undefined,
      createdBefore: searchParams.get('createdBefore') || undefined,
      lastLoginAfter: searchParams.get('lastLoginAfter') || undefined,
      lastLoginBefore: searchParams.get('lastLoginBefore') || undefined,
    }

    // Call the Server Action
    const result = await listUsersAction(query)
    
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
      users: result.users,
      pagination: result.pagination,
    })
    
  } catch (error) {
    console.error('API list users error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}