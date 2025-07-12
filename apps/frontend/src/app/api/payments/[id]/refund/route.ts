import { NextRequest, NextResponse } from 'next/server'
import { refundPaymentAction } from '@/lib/actions/payment'

// Refund payment (POST /api/payments/[id]/refund)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const data = {
      paymentId: params.id,
      refundAmount: body.refundAmount,
      reason: body.reason,
      refundReference: body.refundReference,
      notifyClient: body.notifyClient ?? true,
    }
    
    const result = await refundPaymentAction(data)
    
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
      originalPayment: result.data?.originalPayment,
      refundPayment: result.data?.refundPayment,
      refundAmount: result.data?.refundAmount,
      reason: result.data?.reason,
    })
    
  } catch (error) {
    console.error('API payment refund error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}