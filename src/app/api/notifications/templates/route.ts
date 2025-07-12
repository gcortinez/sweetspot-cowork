import { NextRequest, NextResponse } from 'next/server'
import { 
  createNotificationTemplateAction,
  listNotificationTemplatesAction 
} from '@/lib/actions/notification'

/**
 * GET /api/notifications/templates - List notification templates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') || undefined
    const category = searchParams.get('category') || undefined
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined
    const isSystem = searchParams.get('isSystem') ? searchParams.get('isSystem') === 'true' : undefined
    const language = searchParams.get('language') || undefined
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const result = await listNotificationTemplatesAction({
      page,
      limit,
      search,
      type: type as any,
      category: category as any,
      isActive,
      isSystem,
      language,
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
    console.error('List notification templates API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/templates - Create notification template
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createNotificationTemplateAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Create notification template API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}