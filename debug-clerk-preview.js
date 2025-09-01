const { clerkClient } = require('@clerk/nextjs/server');

async function debugClerkConfiguration() {
  try {
    console.log('🔍 Debugging Clerk Configuration for Preview Environment');
    console.log('====================================================\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('   VERCEL_URL:', process.env.VERCEL_URL || 'Not set');
    console.log('   VERCEL_ENV:', process.env.VERCEL_ENV || 'Not set');
    console.log('   NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set');
    console.log('   CLERK_SECRET_KEY starts with:', process.env.CLERK_SECRET_KEY?.substring(0, 10) + '...' || 'Not set');
    console.log('   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY starts with:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 15) + '...' || 'Not set');
    
    // Check if we're in development or production instance
    const isDevelopment = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('_test_');
    console.log('\n🏗️ Clerk Instance Type:');
    console.log('   Instance:', isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION');
    console.log('   Suitable for *.vercel.app:', isDevelopment ? '✅ YES' : '❌ NO');
    
    // Test Clerk client connection
    console.log('\n🔌 Testing Clerk Connection:');
    const clerk = await clerkClient();
    
    try {
      // Try to list invitations to test API connection
      const invitations = await clerk.invitations.getInvitationList({ limit: 1 });
      console.log('   Connection:', '✅ SUCCESS');
      console.log('   Total invitations:', invitations.totalCount || 0);
    } catch (error) {
      console.log('   Connection:', '❌ FAILED');
      console.log('   Error:', error.message);
    }
    
    // Recommendations
    console.log('\n💡 Recommendations for Preview Environment:');
    if (isDevelopment) {
      console.log('   ✅ You are using development credentials (correct for preview)');
      console.log('   📝 Make sure your Clerk Development instance allows:');
      console.log('      - Domain: *.vercel.app');
      console.log('      - Or specific domain: ' + (process.env.VERCEL_URL || 'your-preview-url.vercel.app'));
    } else {
      console.log('   ⚠️  You are using production credentials');
      console.log('   📝 For preview environments, consider:');
      console.log('      1. Using development credentials with *.vercel.app domain');
      console.log('      2. Or setting up a custom domain with production credentials');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Go to Clerk Dashboard → Domains');
    console.log('   2. Add your preview domain as allowed');
    console.log('   3. Ensure redirect URLs include your preview domain');
    console.log('   4. Test invitation creation again');
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  }
}

debugClerkConfiguration();