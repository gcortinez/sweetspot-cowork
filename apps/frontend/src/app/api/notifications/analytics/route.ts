import { NextRequest, NextResponse } from 'next/server'
import { getNotificationAnalyticsAction } from '@/lib/actions/notification'

/**
 * GET /api/notifications/analytics - Get notification analytics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const groupBy = searchParams.get('groupBy') || 'day'
    const includeDeliveryRates = searchParams.get('includeDeliveryRates') === 'true'
    const includeEngagementRates = searchParams.get('includeEngagementRates') === 'true'

    const result = await getNotificationAnalyticsAction({
      startDate,
      endDate,
      groupBy: groupBy as any,
      includeDeliveryRates,
      includeEngagementRates,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Get notification analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}