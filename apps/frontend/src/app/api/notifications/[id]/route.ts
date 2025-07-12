import { NextRequest, NextResponse } from 'next/server'
import { 
  getNotificationAction,
  updateNotificationAction,
  deleteNotificationAction,
  markNotificationReadAction
} from '@/lib/actions/notification'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/notifications/[id] - Get notification by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await getNotificationAction({ id: params.id })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Notification not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Get notification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/[id] - Update notification
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const data = await request.json()
    const result = await updateNotificationAction({
      id: params.id,
      ...data,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: result.error === 'Notification not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Update notification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/[id] - Delete notification
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await deleteNotificationAction({ id: params.id })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Notification not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Delete notification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}