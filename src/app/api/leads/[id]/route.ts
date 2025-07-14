import { NextRequest, NextResponse } from 'next/server';
import { getLead, updateLead, deleteLead } from '@/lib/actions/leads';

// API routes that delegate to Server Actions

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('PUT /api/leads/[id] - Updating lead:', id, body);
    
    // Call Server Action
    const result = await updateLead(id, body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: result.error === 'Prospecto no encontrado' ? 404 : 400 }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in PUT /api/leads/[id]:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('DELETE /api/leads/[id] - Deleting lead:', id);
    
    // Call Server Action
    const result = await deleteLead(id);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: result.error === 'Prospecto no encontrado' ? 404 : 400 }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in DELETE /api/leads/[id]:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('GET /api/leads/[id] - Getting lead:', id);
    
    // Call Server Action
    const result = await getLead(id);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: result.error === 'Prospecto no encontrado' ? 404 : 400 }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in GET /api/leads/[id]:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}