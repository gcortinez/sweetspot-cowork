import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { getApiBaseUrl } from '@/lib/api-config';

// Schema for updating a lead
const UpdateLeadSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']).optional(),
  channel: z.string().optional(),
  budget: z.number().optional(),
  interests: z.array(z.string()).optional(),
  qualificationNotes: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'FOLLOW_UP', 'CONVERTED', 'LOST', 'DORMANT']).optional(),
  score: z.number().min(0).max(100).optional(),
  assignedToId: z.string().optional(),
});

// Helper function to get auth token from request
async function getAuthToken(request: NextRequest): Promise<string | null> {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try to get token from cookies as fallback
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('auth-token');
  return tokenCookie?.value || null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('=== API ROUTE: PUT /api/leads/[id] ===');
    console.log('Lead ID:', id);
    console.log('Update data:', body);
    
    // Validate the request body
    const validatedData = UpdateLeadSchema.parse(body);
    
    // Get auth token
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { message: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }
    
    // TODO: Implement actual database update once leads table is created
    console.log('Lead update not yet implemented');
    
    // For now, return success with the updated data
    const updatedLead = {
      id,
      ...validatedData,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: updatedLead
    });
    
  } catch (error) {
    console.error('Error updating lead:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Datos inválidos',
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
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
    
    console.log('=== API ROUTE: DELETE /api/leads/[id] ===');
    console.log('Lead ID:', id);
    
    // Get auth token
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { message: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }
    
    // TODO: Implement actual database deletion once leads table is created
    console.log('Lead deletion not yet implemented');
    
    return NextResponse.json({ 
      success: true,
      message: 'Prospecto eliminado exitosamente' 
    });
    
  } catch (error) {
    console.error('Error deleting lead:', error);
    
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
    
    console.log('=== API ROUTE: GET /api/leads/[id] ===');
    console.log('Lead ID:', id);
    
    // Get auth token
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { message: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }
    
    // TODO: Implement actual database query once leads table is created
    console.log('Lead fetch not yet implemented');
    
    // Return not found for now
    return NextResponse.json(
      { message: 'Prospecto no encontrado' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error fetching lead:', error);
    
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}