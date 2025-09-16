import { getCurrentUser } from '@/lib/server/auth'

async function testCurrentUserAPI() {
  try {
    console.log('🔍 Testing getCurrentUser function directly...');

    const user = await getCurrentUser();

    if (!user) {
      console.log('❌ No user found (not authenticated or no session)');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      isOnboarded: user.isOnboarded,
      clerkId: user.clerkId
    });

  } catch (error) {
    console.error('❌ Error testing getCurrentUser:', error);
  }
}

testCurrentUserAPI();