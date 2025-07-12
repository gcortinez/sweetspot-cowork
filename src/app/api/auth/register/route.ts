import { NextRequest, NextResponse } from 'next/server'
import { registerAction } from '@/lib/actions/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the Server Action
    const result = await registerAction(body)
    
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
      tenant: result.tenant,
      message: 'Registration successful',
    })
    
  } catch (error) {
    console.error('API register error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}