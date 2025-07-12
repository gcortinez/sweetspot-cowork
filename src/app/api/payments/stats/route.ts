import { NextRequest, NextResponse } from 'next/server'
import { getPaymentStatsAction } from '@/lib/actions/payment'

// Get payment statistics (GET /api/payments/stats)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      clientIds: searchParams.get('clientIds')?.split(',').filter(Boolean) || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      status: searchParams.get('status')?.split(',').filter(Boolean) as any || undefined,
      methods: searchParams.get('methods')?.split(',').filter(Boolean) as any || undefined,
      currency: searchParams.get('currency')?.split(',').filter(Boolean) || undefined,
      includeRefunds: searchParams.get('includeRefunds') !== 'false',
      includeFeesAnalysis: searchParams.get('includeFeesAnalysis') !== 'false',
      includeMethodBreakdown: searchParams.get('includeMethodBreakdown') !== 'false',
      groupBy: searchParams.get('groupBy') as any || 'month',
    }

    const result = await getPaymentStatsAction(filters)
    
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
    console.error('API payment stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}