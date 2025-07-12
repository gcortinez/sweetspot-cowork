import { NextRequest, NextResponse } from 'next/server'
import { markInvoicePaidAction } from '@/lib/actions/invoice'

// Mark invoice as paid (POST /api/invoices/[id]/mark-paid)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const data = {
      invoiceId: params.id,
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference,
      paidAmount: body.paidAmount,
      paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
      notes: body.notes,
    }
    
    const result = await markInvoicePaidAction(data)
    
    if (!result.success) {
      const status = result.error === 'Invoice not found' ? 404 : 400
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
      invoice: result.data,
    })
    
  } catch (error) {
    console.error('API mark invoice paid error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}