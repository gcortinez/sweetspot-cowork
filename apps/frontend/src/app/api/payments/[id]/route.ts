import { NextRequest, NextResponse } from 'next/server'
import { getPaymentAction, updatePaymentAction } from '@/lib/actions/payment'

// Get payment by ID (GET /api/payments/[id])
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getPaymentAction(params.id)
    
    if (!result.success) {
      const status = result.error === 'Payment not found' ? 404 : 400
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
      payment: result.data,
    })
    
  } catch (error) {
    console.error('API payment retrieval error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Update payment (PUT /api/payments/[id])
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Convert date strings to Date objects
    if (body.processedAt) {
      body.processedAt = new Date(body.processedAt)
    }
    
    const result = await updatePaymentAction(params.id, body)
    
    if (!result.success) {
      const status = result.error === 'Payment not found' ? 404 : 400
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
      payment: result.data,
    })
    
  } catch (error) {
    console.error('API payment update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}