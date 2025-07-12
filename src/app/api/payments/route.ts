import { NextRequest, NextResponse } from 'next/server'
import { createPaymentAction, listPaymentsAction } from '@/lib/actions/payment'

// List payments (GET /api/payments)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      clientId: searchParams.get('clientId') || undefined,
      invoiceId: searchParams.get('invoiceId') || undefined,
      method: searchParams.get('method') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
      search: searchParams.get('search') || undefined,
      currency: searchParams.get('currency') || undefined,
      hasInvoice: searchParams.get('hasInvoice') ? searchParams.get('hasInvoice') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') as any || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
    }

    const result = await listPaymentsAction(filters)
    
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
      payments: result.data?.payments,
      pagination: result.data?.pagination,
    })
    
  } catch (error) {
    console.error('API payments list error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Create payment (POST /api/payments)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert date strings to Date objects
    if (body.processedAt) {
      body.processedAt = new Date(body.processedAt)
    }
    
    // Call the Server Action
    const result = await createPaymentAction(body)
    
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
      payment: result.data,
    }, { status: 201 })
    
  } catch (error) {
    console.error('API payment creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}