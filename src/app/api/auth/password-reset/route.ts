import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordResetAction, resetPasswordAction } from '@/lib/actions/auth'

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the Server Action
    const result = await requestPasswordResetAction(body)
    
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
      message: result.message,
    })
    
  } catch (error) {
    console.error('API password reset request error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Reset password with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the Server Action
    const result = await resetPasswordAction(body)
    
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
      message: result.message,
    })
    
  } catch (error) {
    console.error('API password reset error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}