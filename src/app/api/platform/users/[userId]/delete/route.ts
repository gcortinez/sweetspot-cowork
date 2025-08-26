import { NextRequest, NextResponse } from 'next/server'
import { deleteUser } from '@/lib/actions/users'

/**
 * Delete User API
 * Removes user from both database and Clerk
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log('🗑️ Delete user API called for:', params.userId)
    
    const response = await deleteUser(params.userId)
    
    if (response.success) {
      return NextResponse.json({
        success: true,
        message: response.message
      })
    } else {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: response.error?.includes('permisos') ? 403 : 404 }
      )
    }

  } catch (error) {
    console.error('Delete user API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}