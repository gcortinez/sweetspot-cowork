import { NextRequest, NextResponse } from 'next/server'
import { 
  createExternalServiceAction,
  listExternalServicesAction 
} from '@/lib/actions/integration'

/**
 * GET /api/integrations/services - List external services
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const provider = searchParams.get('provider') || undefined
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const result = await listExternalServicesAction({
      page,
      limit,
      search,
      type: type as any,
      status: status as any,
      provider,
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
    console.error('List external services API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/integrations/services - Create external service
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const result = await createExternalServiceAction(data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Create external service API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}