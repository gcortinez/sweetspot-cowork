/**
 * API compatibility layer for visitors
 * Provides RESTful endpoints that use Server Actions internally
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createVisitorAction, 
  listVisitorsAction,
  type CreateVisitorRequest,
  type ListVisitorsRequest
} from '@/lib/actions/visitor'

/**
 * GET /api/v1/visitors
 * List visitors with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const params: ListVisitorsRequest = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      purpose: searchParams.get('purpose') as any || undefined,
      hostUserId: searchParams.get('hostUserId') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      isBlacklisted: searchParams.get('isBlacklisted') ? searchParams.get('isBlacklisted') === 'true' : undefined,
      isRecurring: searchParams.get('isRecurring') ? searchParams.get('isRecurring') === 'true' : undefined,
      sortBy: searchParams.get('sortBy') as any || 'expectedArrival',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
    }

    const result = await listVisitorsAction(params)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('List visitors API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/visitors
 * Create a new visitor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert string dates to Date objects
    const visitorData = {
      ...body,
      expectedArrival: new Date(body.expectedArrival),
      expectedDeparture: body.expectedDeparture ? new Date(body.expectedDeparture) : undefined,
      actualArrival: body.actualArrival ? new Date(body.actualArrival) : undefined,
      actualDeparture: body.actualDeparture ? new Date(body.actualDeparture) : undefined,
      preRegistrationExpiresAt: body.preRegistrationExpiresAt ? new Date(body.preRegistrationExpiresAt) : undefined,
      blacklistedAt: body.blacklistedAt ? new Date(body.blacklistedAt) : undefined,
      recurrenceRule: body.recurrenceRule ? {
        ...body.recurrenceRule,
        endDate: body.recurrenceRule.endDate ? new Date(body.recurrenceRule.endDate) : undefined,
      } : undefined,
      idVerification: body.idVerification ? {
        ...body.idVerification,
        expiryDate: body.idVerification.expiryDate ? new Date(body.idVerification.expiryDate) : undefined,
        verifiedAt: body.idVerification.verifiedAt ? new Date(body.idVerification.verifiedAt) : undefined,
      } : undefined,
      healthSafety: body.healthSafety ? {
        ...body.healthSafety,
        temperatureCheck: body.healthSafety.temperatureCheck ? {
          ...body.healthSafety.temperatureCheck,
          checkedAt: body.healthSafety.temperatureCheck.checkedAt ? new Date(body.healthSafety.temperatureCheck.checkedAt) : undefined,
        } : undefined,
      } : undefined,
    }

    const result = await createVisitorAction(visitorData as CreateVisitorRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    }, { status: 201 })
  } catch (error) {
    console.error('Create visitor API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}