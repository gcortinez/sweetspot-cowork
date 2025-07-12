import { NextRequest, NextResponse } from 'next/server'
import { 
  createApiKeyAction,
  listApiKeysAction 
} from '@/lib/actions/integration'

/**
 * GET /api/integrations/api-keys - List API keys
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined
    const environment = searchParams.get('environment') || undefined
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const result = await listApiKeysAction({
      page,
      limit,
      search,
      isActive,
      environment: environment as any,
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
    console.error('List API keys API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/integrations/api-keys - Create API key
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createApiKeyAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Create API key API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}