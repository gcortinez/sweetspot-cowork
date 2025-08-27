const { clerkClient } = require('@clerk/nextjs/server');

async function testProductionInvitation() {
  console.log('🧪 Testing Clerk Production Invitation System...\n');
  
  const testEmail = 'test-prod@example.com';
  
  try {
    // Validate environment variables
    if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      throw new Error('Missing required environment variables: CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    }
    
    const clerk = await clerkClient();
    
    console.log('1. Testing with production Clerk keys...');
    console.log('   Secret Key prefix:', process.env.CLERK_SECRET_KEY.substring(0, 10) + '...');
    
    // List existing invitations
    console.log('\n2. Checking existing invitations...');
    try {
      const invitations = await clerk.invitations.getInvitationList();
      console.log('   Total invitations:', invitations.data?.length || 0);
      
      const testInvitation = invitations.data?.find(inv => inv.emailAddress === testEmail);
      if (testInvitation) {
        console.log('   Found existing test invitation:', testInvitation.id);
        console.log('   Status:', testInvitation.status);
        
        if (testInvitation.status === 'pending') {
          console.log('   Revoking existing invitation...');
          await clerk.invitations.revokeInvitation(testInvitation.id);
        }
      }
    } catch (listError) {
      console.error('   Error listing invitations:', listError.message);
      console.error('   Status:', listError.status);
      console.error('   Errors:', listError.errors);
    }
    
    // Try to create an invitation
    console.log('\n3. Creating test invitation...');
    try {
      const invitation = await clerk.invitations.createInvitation({
        emailAddress: testEmail,
        redirectUrl: 'https://cowork.thesweetspot.cloud/invitation/accept',
        publicMetadata: {
          role: 'COWORK_USER',
          tenantId: 'test-tenant-id',
          tenantName: 'Test Cowork'
        },
        notify: false, // Don't send real email
        ignoreExisting: true
      });
      
      console.log('   ✅ Invitation created successfully!');
      console.log('   Invitation ID:', invitation.id);
      console.log('   Email:', invitation.emailAddress);
      console.log('   Status:', invitation.status);
      
      // Clean up
      console.log('\n4. Cleaning up test invitation...');
      await clerk.invitations.revokeInvitation(invitation.id);
      console.log('   ✅ Test invitation cleaned up');
      
    } catch (createError) {
      console.error('   ❌ Failed to create invitation:');
      console.error('   Message:', createError.message);
      console.error('   Status:', createError.status);
      console.error('   Errors:', createError.errors);
      
      if (createError.errors && createError.errors.length > 0) {
        createError.errors.forEach((err, index) => {
          console.error(`   Error ${index + 1}:`, err.code, '-', err.longMessage || err.message);
          if (err.meta) {
            console.error('     Metadata:', err.meta);
          }
        });
      }
      
      // Check if it's a domain/environment issue
      if (createError.message?.includes('domain') || createError.message?.includes('environment')) {
        console.error('\n   🔍 Possible domain configuration issue');
        console.error('   Production domain should be: cowork.thesweetspot.cloud');
      }
    }
    
    // Test getting user list
    console.log('\n5. Testing user list API...');
    try {
      const users = await clerk.users.getUserList({ limit: 1 });
      console.log('   ✅ Can fetch users:', users.data?.length || 0, 'users found');
    } catch (userError) {
      console.error('   ❌ Cannot fetch users:', userError.message);
    }
    
  } catch (error) {
    console.error('\n❌ General error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testProductionInvitation();