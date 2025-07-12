import { NextRequest, NextResponse } from 'next/server'
import { getFinancialReportAction } from '@/lib/actions/financial-report'

// Get financial report by ID (GET /api/financial-reports/[id])
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getFinancialReportAction(params.id)
    
    if (!result.success) {
      const status = result.error === 'Financial report not found' ? 404 : 400
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
      report: result.data,
    })
    
  } catch (error) {
    console.error('API financial report retrieval error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}