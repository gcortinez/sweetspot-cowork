import { NextRequest, NextResponse } from 'next/server'
import { 
  listServicesAction,
  createCoworkingServicesAction,
  getServicesByCategoryAction,
  getServicePackagesAction,
  deleteAllServicesAction
} from '@/lib/actions/service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const isActiveParam = searchParams.get('isActive')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    let isActive: boolean | undefined = undefined
    if (isActiveParam === 'true') isActive = true
    if (isActiveParam === 'false') isActive = false

    const result = await listServicesAction({
      page,
      limit,
      search,
      category: category === 'all' ? undefined : category,
      isActive,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    })

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch services' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'createPredefined') {
      const result = await createCoworkingServicesAction()
      
      if (result.success) {
        return NextResponse.json(result)
      } else {
        return NextResponse.json(
          { error: result.error || 'Failed to create services' },
          { status: 400 }
        )
      }
    }
    
    if (action === 'deleteAll') {
      const result = await deleteAllServicesAction()
      
      if (result.success) {
        return NextResponse.json(result)
      } else {
        return NextResponse.json(
          { error: result.error || 'Failed to delete services' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing services request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}