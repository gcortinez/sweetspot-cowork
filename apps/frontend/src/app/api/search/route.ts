import { NextRequest, NextResponse } from 'next/server'
import { globalSearchAction, advancedSearchAction, getSearchSuggestionsAction } from '@/lib/actions/search'

// Global search (GET /api/search)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const type = searchParams.get('type')
    
    // Handle search suggestions
    if (searchParams.get('suggestions') === 'true') {
      if (!query) {
        return NextResponse.json({
          success: true,
          suggestions: [],
        })
      }

      const result = await getSearchSuggestionsAction(query, type || undefined)
      
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        suggestions: result.suggestions,
      })
    }
    
    // Handle global search
    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query is required',
        },
        { status: 400 }
      )
    }

    const searchData = {
      query,
      types: searchParams.get('types')?.split(',') as any[] || undefined,
      limit: parseInt(searchParams.get('limit') || '10'),
    }

    const result = await globalSearchAction(searchData)
    
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
      results: result.results,
      totalResults: result.totalResults,
      query: result.query,
    })
    
  } catch (error) {
    console.error('API global search error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Advanced search (POST /api/search)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Call the Server Action
    const result = await advancedSearchAction(body)
    
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
      results: result.results,
      pagination: result.pagination,
      model: result.model,
      query: result.query,
      filters: result.filters,
    })
    
  } catch (error) {
    console.error('API advanced search error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}