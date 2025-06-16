import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';

// Schema for creating a lead
const CreateLeadSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'WALK_IN', 'PARTNER', 'OTHER']),
  channel: z.string().optional(),
  budget: z.number().optional(),
  interests: z.array(z.string()).optional(),
  qualificationNotes: z.string().optional(),
  assignedToId: z.string().optional(),
});

// Helper function to get auth token from request
function getAuthToken(request: NextRequest): string | null {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try to get token from cookies as fallback
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('auth-token'); // Note: hyphen not underscore
  return tokenCookie?.value || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateLeadSchema.parse(body);
    
    // Get auth token
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { message: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }
    
    // Make request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(validatedData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || 'Error al crear el prospecto' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('Error creating lead:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    console.log('=== FRONTEND API ROUTE: GET /api/leads ===');
    
    // Get auth token from request (or use bypass for testing)
    let token = getAuthToken(request);
    if (!token) {
      console.log('No auth token found, using bypass token for testing');
      token = 'bypass_token_testing123';
    }
    
    console.log('Using token:', token.substring(0, 20) + '...');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    
    // Build query string
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(status && { status }),
      ...(source && { source }),
    });
    
    // Make authenticated request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const fullUrl = `${backendUrl}/api/leads?${queryParams}`;
    
    console.log('Making request to backend:', fullUrl);
    console.log('With headers:', { 'Authorization': `Bearer ${token.substring(0, 20)}...` });
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error response:', errorData);
      return NextResponse.json(
        { message: errorData.message || 'Error al obtener los prospectos' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('Backend success response:', {
      leadsCount: result.data?.leads?.length || 0,
      hasData: !!result.data
    });
    console.log('=== END FRONTEND API ROUTE ===');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching leads:', error);
    
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}