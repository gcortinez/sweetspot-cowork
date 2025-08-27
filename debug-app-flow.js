const { clerkClient } = require('@clerk/nextjs/server');

async function debugAppFlow() {
  console.log('🔍 Debugging App Flow vs Direct Clerk...\n');
  
  const email = 'contacto2@getsweetspot.io';
  
  try {
    const clerk = await clerkClient();
    
    console.log('=== SIMULATING APP FLOW ===');
    
    // 1. Check for existing invitations (like the app does)
    console.log('1. Checking existing invitations...');
    const existingInvitations = await clerk.invitations.getInvitationList();
    const userInvitations = existingInvitations.data?.filter(
      inv => inv.emailAddress === email
    );
    
    console.log('   Total invitations in Clerk:', existingInvitations.data?.length || 0);
    console.log('   User-specific invitations:', userInvitations?.length || 0);
    
    // 2. Check for existing users (like the app does)
    console.log('2. Checking existing users...');
    try {
      const users = await clerk.users.getUserList({ emailAddress: [email] });
      console.log('   Users found:', users.data?.length || 0);
      
      if (users.data && users.data.length > 0) {
        console.log('   ❌ FOUND EXISTING USER - App would fail here');
        users.data.forEach(user => {
          console.log('      - ID:', user.id);
          console.log('      - Created:', user.createdAt);
        });
      }
    } catch (userError) {
      console.log('   ✅ No users found (expected):', userError.message);
    }
    
    // 3. Try to create invitation with app's exact parameters
    console.log('3. Creating invitation with app parameters...');
    
    const appParams = {
      emailAddress: email,
      redirectUrl: 'https://cowork.thesweetspot.cloud/accept-invitation',
      publicMetadata: {
        role: 'COWORK_USER',
        tenantId: 'cmd207vzc0000e6fh9c1l1pur',
        tenantName: 'Nube',
        invitedBy: 'some-user-id',
        invitationDate: new Date().toISOString()
      },
      notify: true,
      ignoreExisting: true
    };
    
    console.log('   Using parameters:');
    console.log('   ', JSON.stringify(appParams, null, 4));
    
    try {
      const invitation = await clerk.invitations.createInvitation(appParams);
      console.log('   ✅ App-style invitation created:', invitation.id);
      
      // Clean up
      await clerk.invitations.revokeInvitation(invitation.id);
      console.log('   🗑️ Test invitation cleaned up');
      
    } catch (appError) {
      console.log('   ❌ App-style invitation failed:');
      console.log('      Message:', appError.message);
      console.log('      Status:', appError.status);
      console.log('      Errors:', appError.errors);
      
      if (appError.errors && appError.errors.length > 0) {
        appError.errors.forEach((err, index) => {
          console.log(`      Error ${index + 1}:`, err.code, '-', err.longMessage || err.message);
          console.log('        Metadata:', err.meta);
        });
      }
    }
    
    // 4. Compare with simple direct approach
    console.log('\n4. Comparing with simple direct approach...');
    try {
      const simpleInvitation = await clerk.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: 'https://cowork.thesweetspot.cloud/accept-invitation',
        notify: false,
        ignoreExisting: true
      });
      
      console.log('   ✅ Simple invitation created:', simpleInvitation.id);
      
      // Clean up
      await clerk.invitations.revokeInvitation(simpleInvitation.id);
      console.log('   🗑️ Simple invitation cleaned up');
      
    } catch (simpleError) {
      console.log('   ❌ Simple invitation also failed:', simpleError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAppFlow();