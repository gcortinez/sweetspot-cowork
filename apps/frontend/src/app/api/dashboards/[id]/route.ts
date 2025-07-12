import { NextRequest, NextResponse } from 'next/server'
import { 
  getDashboardAction,
  updateDashboardAction,
  deleteDashboardAction
} from '@/lib/actions/report'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/dashboards/[id] - Get dashboard by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeData = searchParams.get('includeData') !== 'false' // Default to true

    const result = await getDashboardAction({ 
      id: params.id,
      includeData,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Dashboard not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Get dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/dashboards/[id] - Update dashboard
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const data = await request.json()
    const result = await updateDashboardAction({
      id: params.id,
      ...data,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: result.error === 'Dashboard not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Update dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/dashboards/[id] - Delete dashboard
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await deleteDashboardAction({ id: params.id })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Dashboard not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({ message: 'Dashboard deleted successfully' })
  } catch (error) {
    console.error('Delete dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}