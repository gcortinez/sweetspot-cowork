import { NextRequest, NextResponse } from 'next/server'
import { executeDataMigrationAction } from '@/lib/actions/integration'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/integrations/migrations/[id]/execute - Execute migration
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const data = await request.json()
    const result = await executeDataMigrationAction({
      id: params.id,
      ...data,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: result.error === 'Migration not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data, { status: 202 }) // Accepted - async execution
  } catch (error) {
    console.error('Execute migration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}