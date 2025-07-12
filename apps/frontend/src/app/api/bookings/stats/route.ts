import { NextRequest, NextResponse } from 'next/server'
import { getBookingStatsAction } from '@/lib/actions/booking'

// Get booking statistics (GET /api/bookings/stats)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      spaceIds: searchParams.get('spaceIds')?.split(',').filter(Boolean) || undefined,
      userIds: searchParams.get('userIds')?.split(',').filter(Boolean) || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      status: searchParams.get('status')?.split(',').filter(Boolean) as any || undefined,
      includeRevenue: searchParams.get('includeRevenue') !== 'false',
      includeUtilization: searchParams.get('includeUtilization') !== 'false',
      includeUserMetrics: searchParams.get('includeUserMetrics') !== 'false',
      groupBy: searchParams.get('groupBy') as any || 'day',
    }

    const result = await getBookingStatsAction(filters)
    
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
    console.error('API booking stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}