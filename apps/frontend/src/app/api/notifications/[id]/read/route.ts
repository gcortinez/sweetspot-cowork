import { NextRequest, NextResponse } from 'next/server'
import { markNotificationReadAction } from '@/lib/actions/notification'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/notifications/[id]/read - Mark notification as read
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const data = await request.json()
    const result = await markNotificationReadAction({
      id: params.id,
      userId: data.userId,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: result.error === 'Notification not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Mark notification read API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}