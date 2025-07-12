import { NextRequest, NextResponse } from 'next/server'
import { loginAction } from '@/lib/actions/auth'

/**
 * API Route Compatibility Layer for Authentication
 * Provides backward compatibility with existing API endpoints
 * while transitioning to Server Actions
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Debug: console.log('🔍 API Route received body:', { hasEmail: !!body.email, hasPassword: !!body.password, keys: Object.keys(body) })
    
    // Call the Server Action
    const result = await loginAction(body)
    // Debug: console.log('🔍 LoginAction result:', { success: result.success, hasUser: !!result.user, hasAccessToken: !!result.accessToken, hasRefreshToken: !!result.refreshToken })
    
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

    // Handle multi-tenant selection
    if (result.requiresTenantSelection) {
      return NextResponse.json({
        success: true,
        requiresTenantSelection: true,
        tenants: result.tenants,
      })
    }

    // Successful login
    return NextResponse.json({
      success: true,
      user: result.user,
      tenant: result.tenant,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      message: 'Login successful',
    })
    
  } catch (error) {
    console.error('API login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}