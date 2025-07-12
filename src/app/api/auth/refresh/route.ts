import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/server/auth'

/**
 * API Route for Token Refresh
 * Refreshes access tokens using refresh tokens
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token is required',
        },
        { status: 400 }
      )
    }

    // Call the AuthService to refresh the token
    const result = await AuthService.refreshToken(refreshToken)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Token refresh failed',
        },
        { status: 401 }
      )
    }

    // Successful token refresh
    return NextResponse.json({
      success: true,
      user: result.user,
      tenant: result.tenant,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
    })
    
  } catch (error) {
    console.error('API refresh token error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}