import { NextRequest, NextResponse } from 'next/server'
import { processPaymentAction } from '@/lib/actions/payment'

// Process payment (POST /api/payments/[id]/process)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const data = {
      paymentId: params.id,
      processorResponse: body.processorResponse,
      transactionId: body.transactionId,
      processorFee: body.processorFee,
      notes: body.notes,
    }
    
    const result = await processPaymentAction(data)
    
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
    console.error('API payment processing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}