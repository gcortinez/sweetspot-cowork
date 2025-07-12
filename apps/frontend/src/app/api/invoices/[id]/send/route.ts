import { NextRequest, NextResponse } from 'next/server'
import { sendInvoiceAction } from '@/lib/actions/invoice'

// Send invoice (POST /api/invoices/[id]/send)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const data = {
      invoiceId: params.id,
      sendEmail: body.sendEmail ?? true,
      emailMessage: body.emailMessage,
      reminderDate: body.reminderDate ? new Date(body.reminderDate) : undefined,
    }
    
    const result = await sendInvoiceAction(data)
    
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
      invoice: result.data?.invoice,
      sent: result.data?.sent,
      message: result.data?.message,
    })
    
  } catch (error) {
    console.error('API invoice send error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}