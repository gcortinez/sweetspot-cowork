/**
 * API compatibility layer for access control analytics
 * Provides RESTful endpoints for analytics and reporting
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAccessAnalyticsAction,
  type GetAccessAnalyticsRequest
} from '@/lib/actions/access-control'

/**
 * GET /api/v1/access-control/analytics
 * Get access control analytics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const params: GetAccessAnalyticsRequest = {
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      groupBy: searchParams.get('groupBy') as any || 'day',
      accessPointIds: searchParams.get('accessPointIds') ? 
        searchParams.get('accessPointIds')!.split(',') : undefined,
      includeVisitors: searchParams.get('includeVisitors') ? 
        searchParams.get('includeVisitors') === 'true' : true,
    }

    const result = await getAccessAnalyticsAction(params)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Get access analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}