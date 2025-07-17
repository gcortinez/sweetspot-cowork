import { NextRequest, NextResponse } from 'next/server'
import { createServiceAction } from '@/lib/actions/service'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const result = await createServiceAction(data)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to create service',
          fieldErrors: result.fieldErrors 
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}