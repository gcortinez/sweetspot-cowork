import { NextRequest, NextResponse } from 'next/server'
import { getTenantAction, updateTenantAction, deleteTenantAction } from '@/lib/actions/tenant'

// Get tenant by ID (GET /api/tenants/[id])
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Call the Server Action
    const result = await getTenantAction(id)
    
    if (!result.success) {
      const status = result.error === 'Tenant not found' ? 404 : 400
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
      tenant: result.tenant,
    })
    
  } catch (error) {
    console.error('API get tenant error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Update tenant (PUT /api/tenants/[id])
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Call the Server Action
    const result = await updateTenantAction(id, body)
    
    if (!result.success) {
      const status = result.error === 'Tenant not found' ? 404 : 400
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
      tenant: result.tenant,
      message: result.message,
    })
    
  } catch (error) {
    console.error('API update tenant error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Delete tenant (DELETE /api/tenants/[id])
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Call the Server Action
    const result = await deleteTenantAction(id)
    
    if (!result.success) {
      const status = result.error === 'Tenant not found' ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.details && { details: result.details }),
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
    
  } catch (error) {
    console.error('API delete tenant error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}