import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

export async function GET(request: NextRequest) {
  try {
    console.log('=== FRONTEND API ROUTE: GET /api/users ===');
    
    // Get auth token
    let token = await getAuthToken(request);
    if (!token) {
      console.log('No auth token found, using bypass token for testing');
      token = 'bypass_token_testing123';
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const assignable = searchParams.get('assignable') || 'true'; // Only get assignable users by default
    const search = searchParams.get('search') || '';
    
    // Build query string
    const queryParams = new URLSearchParams({
      ...(assignable && { assignable }),
      ...(search && { search }),
    });
    
    // Make request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const fullUrl = `${backendUrl}/api/users?${queryParams}`;
    
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
        { message: errorData.message || 'Error al obtener los usuarios' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('Backend success response:', {
      usersCount: result.data?.users?.length || 0,
      hasData: !!result.data
    });
    console.log('=== END FRONTEND API ROUTE ===');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}