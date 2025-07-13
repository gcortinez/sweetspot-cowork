import { NextRequest, NextResponse } from 'next/server'
import { revokeInvitation } from '@/lib/actions/invitations'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('❌ Revoking invitation:', params.id);
    
    const response = await revokeInvitation(params.id);
    
    if (response.success) {
      return NextResponse.json({
        success: true,
        message: response.message
      });
    } else {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: response.error === 'Authentication required' ? 401 : 
                 response.error === 'Insufficient permissions' ? 403 : 400 }
      );
    }

  } catch (error) {
    console.error('Revoke invitation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke invitation' },
      { status: 500 }
    );
  }
}