import { NextRequest, NextResponse } from 'next/server'
import { getInvoiceAction, updateInvoiceAction, deleteInvoiceAction } from '@/lib/actions/invoice'

// Get invoice by ID (GET /api/invoices/[id])
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getInvoiceAction(params.id)
    
    if (!result.success) {
      const status = result.error === 'Invoice not found' ? 404 : 400
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
      invoice: result.data,
    })
    
  } catch (error) {
    console.error('API invoice retrieval error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Update invoice (PUT /api/invoices/[id])
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Convert date strings to Date objects
    if (body.dueDate) {
      body.dueDate = new Date(body.dueDate)
    }
    
    const result = await updateInvoiceAction(params.id, body)
    
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
    console.error('API invoice update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Delete invoice (DELETE /api/invoices/[id])
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deleteInvoiceAction(params.id)
    
    if (!result.success) {
      const status = result.error === 'Invoice not found' ? 404 : 400
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
      message: 'Invoice deleted successfully',
    })
    
  } catch (error) {
    console.error('API invoice deletion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}