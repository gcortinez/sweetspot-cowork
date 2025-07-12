import { NextRequest, NextResponse } from 'next/server'
import { getTenantStatsAction } from '@/lib/actions/tenant'

// Get tenant statistics (GET /api/tenants/[id]/stats)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Call the Server Action
    const result = await getTenantStatsAction(id)
    
    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 400
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
    })
    
  } catch (error) {
    console.error('API get tenant stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}