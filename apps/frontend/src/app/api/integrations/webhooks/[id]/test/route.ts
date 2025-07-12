import { NextRequest, NextResponse } from 'next/server'
import { testWebhookAction } from '@/lib/actions/integration'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/integrations/webhooks/[id]/test - Test webhook
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const data = await request.json()
    const result = await testWebhookAction({
      id: params.id,
      ...data,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.fieldErrors },
        { status: result.error === 'Webhook not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Test webhook API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}