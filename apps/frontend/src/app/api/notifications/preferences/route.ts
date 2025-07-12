import { NextRequest, NextResponse } from 'next/server'
import { 
  createNotificationPreferencesAction,
  getNotificationPreferencesAction,
  updateNotificationPreferencesAction
} from '@/lib/actions/notification'

/**
 * GET /api/notifications/preferences - Get notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await getNotificationPreferencesAction({ userId })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Notification preferences not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Get notification preferences API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/preferences - Create notification preferences
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createNotificationPreferencesAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Create notification preferences API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences - Update notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await updateNotificationPreferencesAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: result.error === 'User not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Update notification preferences API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}