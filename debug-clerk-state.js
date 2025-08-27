const { clerkClient } = require('@clerk/nextjs/server');

async function debugClerkState() {
  console.log('🔍 Debugging Clerk state...\n');
  
  const emails = ['contacto@getsweetspot.io', 'contacto2@getsweetspot.io'];
  
  try {
    const clerk = await clerkClient();
    
    for (const email of emails) {
      console.log(`\n=== ${email} ===`);
      
      // Check for users
      try {
        const users = await clerk.users.getUserList({ emailAddress: [email] });
        console.log('👤 Users:', users.data?.length || 0);
        
        if (users.data && users.data.length > 0) {
          users.data.forEach(user => {
            console.log('   - ID:', user.id);
            console.log('   - Created:', user.createdAt);
            console.log('   - Email:', user.emailAddresses?.[0]?.emailAddress);
            console.log('   - Banned:', user.banned);
            console.log('   - Locked:', user.locked);
          });
        }
      } catch (userError) {
        console.log('👤 Users error:', userError.message);
      }
      
      // Check for invitations  
      try {
        const allInvitations = await clerk.invitations.getInvitationList();
        const userInvitations = allInvitations.data?.filter(inv => inv.emailAddress === email);
        console.log('📨 Invitations:', userInvitations?.length || 0);
        
        if (userInvitations && userInvitations.length > 0) {
          userInvitations.forEach(inv => {
            console.log('   - ID:', inv.id);
            console.log('   - Status:', inv.status);
            console.log('   - Created:', inv.createdAt);
          });
        }
      } catch (invError) {
        console.log('📨 Invitations error:', invError.message);
      }
      
      // Try creating a test invitation
      try {
        console.log('🧪 Testing invitation creation...');
        const testInvitation = await clerk.invitations.createInvitation({
          emailAddress: email,
          redirectUrl: 'https://cowork.thesweetspot.cloud/accept-invitation',
          notify: false, // Don't send email for test
          ignoreExisting: true
        });
        
        console.log('✅ Test invitation created:', testInvitation.id);
        
        // Immediately revoke the test invitation
        await clerk.invitations.revokeInvitation(testInvitation.id);
        console.log('🗑️ Test invitation revoked');
        
      } catch (testError) {
        console.log('❌ Test invitation failed:', testError.message);
        console.log('   Status:', testError.status);
        console.log('   Errors:', testError.errors);
        
        if (testError.errors && testError.errors.length > 0) {
          testError.errors.forEach((err, index) => {
            console.log(`   Error ${index + 1}:`, err.code, '-', err.longMessage || err.message);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugClerkState();