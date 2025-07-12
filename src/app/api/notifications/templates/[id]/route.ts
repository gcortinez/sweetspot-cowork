import { NextRequest, NextResponse } from 'next/server'
import { 
  getNotificationTemplateAction,
  updateNotificationTemplateAction,
  deleteNotificationTemplateAction
} from '@/lib/actions/notification'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/notifications/templates/[id] - Get notification template by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await getNotificationTemplateAction({ id: params.id })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Notification template not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Get notification template API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/templates/[id] - Update notification template
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const data = await request.json()
    const result = await updateNotificationTemplateAction({
      id: params.id,
      ...data,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: result.error === 'Notification template not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Update notification template API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/templates/[id] - Delete notification template
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const result = await deleteNotificationTemplateAction({ id: params.id })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Notification template not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({ message: 'Notification template deleted successfully' })
  } catch (error) {
    console.error('Delete notification template API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}