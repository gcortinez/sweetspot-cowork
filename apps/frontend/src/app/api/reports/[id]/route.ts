import { NextRequest, NextResponse } from 'next/server'
import { 
  getReportAction,
  updateReportAction,
  deleteReportAction
} from '@/lib/actions/report'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/reports/[id] - Get report by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeData = searchParams.get('includeData') === 'true'

    const result = await getReportAction({ 
      id: params.id,
      includeData,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Report not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Get report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/reports/[id] - Update report
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const data = await request.json()
    const result = await updateReportAction({
      id: params.id,
      ...data,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: result.error === 'Report not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Update report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reports/[id] - Delete report
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await deleteReportAction({ id: params.id })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Report not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Delete report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}