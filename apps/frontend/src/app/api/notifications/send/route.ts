import { NextRequest, NextResponse } from 'next/server'
import { sendNotificationAction } from '@/lib/actions/notification'

/**
 * POST /api/notifications/send - Send notification using template
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await sendNotificationAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Send notification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}