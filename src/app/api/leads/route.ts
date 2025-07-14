import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { getApiBaseUrl } from '@/lib/api-config';

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
async function getAuthToken(request: NextRequest): Promise<string | null> {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try to get token from cookies as fallback
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('auth-token'); // Note: hyphen not underscore
  return tokenCookie?.value || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = CreateLeadSchema.parse(body);
    
    // Get auth token
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { message: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }
    
    // TODO: Implement actual database creation once leads table is created
    console.log('Lead creation not yet implemented:', validatedData);
    
    // For now, return a mock response
    const mockLead = {
      id: `lead-${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: mockLead
    }, { status: 201 });
    
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
    console.log('=== API ROUTE: GET /api/leads ===');
    
    // Get auth token from request
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { message: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }
    
    // For now, return empty leads array since we don't have the leads table set up
    // TODO: Implement actual database query once leads table is created
    console.log('Returning empty leads array - leads feature not yet implemented');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    return NextResponse.json({
      success: true,
      data: {
        leads: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching leads:', error);
    
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}