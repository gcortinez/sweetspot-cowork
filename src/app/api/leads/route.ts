import { NextRequest, NextResponse } from 'next/server';
import { listLeads, createLead } from '@/lib/actions/leads';

// API routes that delegate to Server Actions

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/leads - Creating lead:', body);
    
    // Call Server Action
    const result = await createLead(body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/leads:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/leads - Listing leads');
    
    const { searchParams } = new URL(request.url);
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || undefined,
      source: searchParams.get('source') as any || undefined,
    };
    
    console.log('Query params:', params);
    
    // Call Server Action
    const result = await listLeads(params);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}