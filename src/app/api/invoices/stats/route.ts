import { NextRequest, NextResponse } from 'next/server'
import { getInvoiceStatsAction } from '@/lib/actions/invoice'

// Get invoice statistics (GET /api/invoices/stats)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      clientIds: searchParams.get('clientIds')?.split(',').filter(Boolean) || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      status: searchParams.get('status')?.split(',').filter(Boolean) as any || undefined,
      currency: searchParams.get('currency')?.split(',').filter(Boolean) || undefined,
      includeRevenue: searchParams.get('includeRevenue') !== 'false',
      includeOverdue: searchParams.get('includeOverdue') !== 'false',
      includeCollections: searchParams.get('includeCollections') !== 'false',
      groupBy: searchParams.get('groupBy') as any || 'month',
    }

    const result = await getInvoiceStatsAction(filters)
    
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
      stats: result.data,
    })
    
  } catch (error) {
    console.error('API invoice stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}