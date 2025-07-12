import { NextRequest, NextResponse } from 'next/server'
import { logoutAction } from '@/lib/actions/auth'

export async function POST(request: NextRequest) {
  try {
    // Call the Server Action
    const result = await logoutAction()
    
    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    })
    
  } catch (error) {
    console.error('API logout error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}