import { NextRequest, NextResponse } from 'next/server'
import { createInvoiceAction, listInvoicesAction } from '@/lib/actions/invoice'

// List invoices (GET /api/invoices)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      clientId: searchParams.get('clientId') || undefined,
      status: searchParams.get('status') as any || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
      search: searchParams.get('search') || undefined,
      overdue: searchParams.get('overdue') ? searchParams.get('overdue') === 'true' : undefined,
      unpaid: searchParams.get('unpaid') ? searchParams.get('unpaid') === 'true' : undefined,
      currency: searchParams.get('currency') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') as any || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
    }

    const result = await listInvoicesAction(filters)
    
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
      invoices: result.data?.invoices,
      pagination: result.data?.pagination,
    })
    
  } catch (error) {
    console.error('API invoices list error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Create invoice (POST /api/invoices)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert date strings to Date objects
    if (body.dueDate) {
      body.dueDate = new Date(body.dueDate)
    }
    
    // Call the Server Action
    const result = await createInvoiceAction(body)
    
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
      invoice: result.data,
    }, { status: 201 })
    
  } catch (error) {
    console.error('API invoice creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}