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
    
    console.log('=== FRONTEND API ROUTE: PUT /api/leads/[id] ===');
    console.log('Lead ID:', id);
    console.log('Update data:', body);
    
    // Validate the request body
    const validatedData = UpdateLeadSchema.parse(body);
    
    // Get auth token
    let token = await getAuthToken(request);
    if (!token) {
      console.log('No auth token found, using bypass token for testing');
      token = 'bypass_token_testing123';
    }
    
    // Make request to backend API
    const backendUrl = getApiBaseUrl();
    const fullUrl = `${backendUrl}/api/leads/${id}`;
    
    console.log('Making request to backend:', fullUrl);
    console.log('With data:', validatedData);
    
    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(validatedData),
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error response:', errorData);
      return NextResponse.json(
        { message: errorData.message || 'Error al actualizar el prospecto' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('Backend success response:', result);
    console.log('=== END FRONTEND API ROUTE ===');
    
    return NextResponse.json(result);
    
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
    
    console.log('=== FRONTEND API ROUTE: DELETE /api/leads/[id] ===');
    console.log('Lead ID:', id);
    
    // Get auth token
    let token = await getAuthToken(request);
    if (!token) {
      console.log('No auth token found, using bypass token for testing');
      token = 'bypass_token_testing123';
    }
    
    // Make request to backend API
    const backendUrl = getApiBaseUrl();
    const fullUrl = `${backendUrl}/api/leads/${id}`;
    
    console.log('Making request to backend:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error response:', errorData);
      return NextResponse.json(
        { message: errorData.message || 'Error al eliminar el prospecto' },
        { status: response.status }
      );
    }
    
    console.log('Lead deleted successfully');
    console.log('=== END FRONTEND API ROUTE ===');
    
    return NextResponse.json({ message: 'Prospecto eliminado exitosamente' });
    
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
    
    console.log('=== FRONTEND API ROUTE: GET /api/leads/[id] ===');
    console.log('Lead ID:', id);
    
    // Get auth token
    let token = await getAuthToken(request);
    if (!token) {
      console.log('No auth token found, using bypass token for testing');
      token = 'bypass_token_testing123';
    }
    
    // Make request to backend API
    const backendUrl = getApiBaseUrl();
    const fullUrl = `${backendUrl}/api/leads/${id}`;
    
    console.log('Making request to backend:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error response:', errorData);
      return NextResponse.json(
        { message: errorData.message || 'Error al obtener el prospecto' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('Backend success response:', result);
    console.log('=== END FRONTEND API ROUTE ===');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching lead:', error);
    
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}