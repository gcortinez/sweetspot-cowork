import { NextRequest, NextResponse } from 'next/server'
import { generateCashFlowAnalysisAction } from '@/lib/actions/financial-report'

// Generate cash flow analysis (POST /api/financial-reports/cash-flow-analysis)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert date strings to Date objects
    if (body.startDate) {
      body.startDate = new Date(body.startDate)
    }
    if (body.endDate) {
      body.endDate = new Date(body.endDate)
    }
    
    const result = await generateCashFlowAnalysisAction(body)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          ...(result.fieldErrors && { fieldErrors: result.fieldErrors }),
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis: result.data,
    })
    
  } catch (error) {
    console.error('API cash flow analysis error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}