import { NextRequest, NextResponse } from 'next/server'
import { createAvailabilityAction, bulkUpdateAvailabilityAction } from '@/lib/actions/space'

// Create availability rule (POST /api/spaces/availability)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the Server Action
    const result = await createAvailabilityAction(body)
    
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
      availability: result.data,
    }, { status: 201 })
    
  } catch (error) {
    console.error('API availability creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Bulk update availability (PUT /api/spaces/availability)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the Server Action
    const result = await bulkUpdateAvailabilityAction(body)
    
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
      result: result.data,
    })
    
  } catch (error) {
    console.error('API bulk availability update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}