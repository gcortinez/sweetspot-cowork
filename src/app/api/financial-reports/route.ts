import { NextRequest, NextResponse } from 'next/server'
import { createFinancialReportAction, listFinancialReportsAction } from '@/lib/actions/financial-report'

// List financial reports (GET /api/financial-reports)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters = {
      reportType: searchParams.get('reportType') as any || undefined,
      period: searchParams.get('period') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      generatedBy: searchParams.get('generatedBy') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') as any || 'generatedAt',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
    }

    const result = await listFinancialReportsAction(filters)
    
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
      reports: result.data?.reports,
      pagination: result.data?.pagination,
    })
    
  } catch (error) {
    console.error('API financial reports list error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Create financial report (POST /api/financial-reports)
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
    
    // Call the Server Action
    const result = await createFinancialReportAction(body)
    
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
      report: result.data,
    }, { status: 201 })
    
  } catch (error) {
    console.error('API financial report creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}