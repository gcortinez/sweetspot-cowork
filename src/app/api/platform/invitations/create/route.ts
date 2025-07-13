import { NextRequest, NextResponse } from 'next/server'
import { createInvitation } from '@/lib/actions/invitations'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Creating invitation via API');
    
    const body = await request.json();
    const { emailAddress, role, tenantId } = body;
    
    // Validate required fields
    if (!emailAddress || !role) {
      return NextResponse.json(
        { success: false, error: 'Email address and role are required' },
        { status: 400 }
      );
    }
    
    // Use the existing server action
    const response = await createInvitation({
      emailAddress,
      role,
      tenantId
    });
    
    if (response.success) {
      return NextResponse.json({
        success: true,
        invitation: response.invitation
      });
    } else {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: response.error === 'Authentication required' ? 401 : 
                 response.error === 'Insufficient permissions' ? 403 : 400 }
      );
    }

  } catch (error) {
    console.error('Create invitation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}