import { NextRequest, NextResponse } from 'next/server'
import { getOnboardingStatus } from '@/lib/actions/onboarding'

export async function GET(request: NextRequest) {
  try {
    console.log('👤 Getting onboarding status via API');
    
    const response = await getOnboardingStatus();
    
    if (response.success) {
      return NextResponse.json({
        success: true,
        onboardingComplete: response.onboardingComplete,
        user: response.user,
        invitationData: response.invitationData
      });
    } else {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: response.error === 'Authentication required' ? 401 : 500 }
      );
    }

  } catch (error) {
    console.error('Onboarding status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get onboarding status' },
      { status: 500 }
    );
  }
}