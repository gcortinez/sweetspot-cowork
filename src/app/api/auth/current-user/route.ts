import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/server/auth'

/**
 * Get current user information from database (secure)
 * This endpoint provides role information from database instead of Clerk metadata
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        clientId: user.clientId,
        isOnboarded: user.isOnboarded,
        clerkId: user.clerkId
      }
    })
    
  } catch (error) {
    console.error('Current user API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}