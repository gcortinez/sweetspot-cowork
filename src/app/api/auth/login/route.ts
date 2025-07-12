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
    
    // Call the Server Action
    const result = await loginAction(body)
    
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