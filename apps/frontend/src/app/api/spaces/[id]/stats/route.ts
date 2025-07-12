import { NextRequest, NextResponse } from 'next/server'
import { getSpaceStatsAction } from '@/lib/actions/space'

// Get space statistics (GET /api/spaces/[id]/stats)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      spaceIds: [params.id],
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      includeRevenue: searchParams.get('includeRevenue') !== 'false',
      includeUtilization: searchParams.get('includeUtilization') !== 'false',
      includeBookingTrends: searchParams.get('includeBookingTrends') !== 'false',
    }

    const result = await getSpaceStatsAction(filters)
    
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
    console.error('API space stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}