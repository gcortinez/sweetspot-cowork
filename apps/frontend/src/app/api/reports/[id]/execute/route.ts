import { NextRequest, NextResponse } from 'next/server'
import { executeReportAction } from '@/lib/actions/report'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/reports/[id]/execute - Execute report
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const data = await request.json()
    const result = await executeReportAction({
      id: params.id,
      ...data,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: result.error === 'Report not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data, { status: 202 }) // Accepted - async execution
  } catch (error) {
    console.error('Execute report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}