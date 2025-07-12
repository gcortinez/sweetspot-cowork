import { NextRequest, NextResponse } from 'next/server'
import { updateTenantSettingsAction } from '@/lib/actions/tenant'

// Update tenant settings (PUT /api/tenants/[id]/settings)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Call the Server Action
    const result = await updateTenantSettingsAction(id, body)
    
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
    console.error('API update tenant settings error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}