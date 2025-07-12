import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSessionAction, refreshSessionAction } from '@/lib/actions/auth'

export async function GET(request: NextRequest) {
  try {
    // Call the Server Action
    const result = await getCurrentSessionAction()
    
    if (!result.success || !result.authenticated) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: result.user,
      tenant: result.tenant,
    })
    
  } catch (error) {
    console.error('API session error:', error)
    return NextResponse.json(
      { 
        success: false, 
        authenticated: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Refresh session
    const result = await refreshSessionAction()
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Session refresh failed',
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
    })
    
  } catch (error) {
    console.error('API session refresh error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}