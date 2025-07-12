import { NextRequest, NextResponse } from 'next/server'
import { 
  createWebhookAction,
  listWebhooksAction 
} from '@/lib/actions/integration'

/**
 * GET /api/integrations/webhooks - List webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const events = searchParams.get('events')?.split(',') || undefined
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const result = await listWebhooksAction({
      page,
      limit,
      search,
      events: events as any,
      isActive,
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
    console.error('List webhooks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/integrations/webhooks - Create webhook
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createWebhookAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Create webhook API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}