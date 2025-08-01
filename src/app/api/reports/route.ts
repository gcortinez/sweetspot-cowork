import { NextRequest, NextResponse } from 'next/server'
import { 
  createReportAction,
  listReportsAction 
} from '@/lib/actions/report'

/**
 * GET /api/reports - List reports
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') || undefined
    const format = searchParams.get('format') || undefined
    const frequency = searchParams.get('frequency') || undefined
    const isPublic = searchParams.get('isPublic') ? searchParams.get('isPublic') === 'true' : undefined
    const createdBy = searchParams.get('createdBy') || undefined
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const result = await listReportsAction({
      page,
      limit,
      search,
      type: type as any,
      format: format as any,
      frequency: frequency as any,
      isPublic,
      createdBy,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('List reports API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reports - Create report
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createReportAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Create report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}