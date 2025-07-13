import { NextRequest, NextResponse } from 'next/server'
import { completeOnboarding } from '@/lib/actions/onboarding'

export async function POST(request: NextRequest) {
  try {
    console.log('✅ Completing onboarding via API');
    
    const body = await request.json();
    const { firstName, lastName, phone } = body;
    
    const response = await completeOnboarding({
      firstName,
      lastName,
      phone
    });
    
    if (response.success) {
      return NextResponse.json({
        success: true,
        user: response.user
      });
    } else {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: response.error === 'Authentication required' ? 401 : 500 }
      );
    }

  } catch (error) {
    console.error('Complete onboarding API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}