import { NextRequest, NextResponse } from 'next/server'
import { executeAnalyticsQueryAction } from '@/lib/actions/report'

/**
 * POST /api/analytics/query - Execute analytics query
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await executeAnalyticsQueryAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Execute analytics query API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}