import { NextRequest, NextResponse } from 'next/server'
import { getUserAction, updateUserAction, deleteUserAction } from '@/lib/actions/user'

// Get user by ID (GET /api/users/[id])
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Call the Server Action
    const result = await getUserAction(id)
    
    if (!result.success) {
      const status = result.error === 'User not found or access denied' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    })
    
  } catch (error) {
    console.error('API get user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Update user (PUT /api/users/[id])
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Call the Server Action
    const result = await updateUserAction(id, body)
    
    if (!result.success) {
      const status = result.error === 'User not found' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.fieldErrors && { fieldErrors: result.fieldErrors }),
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: result.message,
    })
    
  } catch (error) {
    console.error('API update user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Delete user (DELETE /api/users/[id])
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Call the Server Action
    const result = await deleteUserAction(id)
    
    if (!result.success) {
      const status = result.error === 'User not found' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
    
  } catch (error) {
    console.error('API delete user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}