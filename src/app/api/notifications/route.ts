import { NextRequest, NextResponse } from 'next/server'
import { 
  createNotificationAction,
  listNotificationsAction,
  sendNotificationAction
} from '@/lib/actions/notification'

/**
 * GET /api/notifications - List notifications
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') || undefined
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const userId = searchParams.get('userId') || undefined
    const clientId = searchParams.get('clientId') || undefined
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const result = await listNotificationsAction({
      page,
      limit,
      type: type as any,
      category: category as any,
      status: status as any,
      priority: priority as any,
      userId,
      clientId,
      dateFrom,
      dateTo,
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
    console.error('List notifications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications - Create and send notification
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createNotificationAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Create notification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}