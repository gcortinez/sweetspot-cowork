import { NextRequest, NextResponse } from 'next/server'
import { getSpaceAction, updateSpaceAction, deleteSpaceAction } from '@/lib/actions/space'

// Get space by ID (GET /api/spaces/[id])
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getSpaceAction(params.id)
    
    if (!result.success) {
      const status = result.error === 'Space not found' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      space: result.data,
    })
    
  } catch (error) {
    console.error('API space retrieval error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Update space (PUT /api/spaces/[id])
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const result = await updateSpaceAction(params.id, body)
    
    if (!result.success) {
      const status = result.error === 'Space not found' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.fieldErrors && { fieldErrors: result.fieldErrors }),
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      space: result.data,
    })
    
  } catch (error) {
    console.error('API space update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Delete space (DELETE /api/spaces/[id])
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deleteSpaceAction(params.id)
    
    if (!result.success) {
      const status = result.error === 'Space not found' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Space deleted successfully',
    })
    
  } catch (error) {
    console.error('API space deletion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}