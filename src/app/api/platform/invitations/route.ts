import { NextRequest, NextResponse } from 'next/server'
import { getInvitations } from '@/lib/actions/invitations'

/**
 * Platform Invitations API
 * Returns all invitations for Super Admins
 */

export async function GET(request: NextRequest) {
  try {
    console.log('📧 Platform Invitations API called');
    
    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'accepted' | 'revoked' | null;
    
    // Use the existing server action
    const response = await getInvitations(status || undefined);
    
    if (response.success) {
      return NextResponse.json({
        success: true,
        invitations: response.invitations
      });
    } else {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: response.error === 'Authentication required' ? 401 : 
                 response.error === 'Insufficient permissions' ? 403 : 500 }
      );
    }

  } catch (error) {
    console.error('Platform invitations API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform invitations' },
      { status: 500 }
    );
  }
}