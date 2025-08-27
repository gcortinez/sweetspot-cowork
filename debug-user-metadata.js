const { clerkClient } = require('@clerk/nextjs/server');

async function debugUserMetadata() {
  console.log('🔍 Debugging User Metadata...\n');
  
  const email = 'gcortinez@getsweetspot.io';
  
  try {
    const clerk = await clerkClient();
    
    // Find user by email
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    
    if (!users.data || users.data.length === 0) {
      console.log('❌ User not found in Clerk');
      return;
    }
    
    const user = users.data[0];
    
    console.log('👤 User Found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.emailAddresses?.[0]?.emailAddress);
    console.log('   Name:', user.firstName, user.lastName);
    console.log('   Created:', user.createdAt);
    console.log('');
    
    console.log('🔒 PRIVATE Metadata:');
    console.log('   Raw:', JSON.stringify(user.privateMetadata, null, 2));
    console.log('   role:', user.privateMetadata?.role);
    console.log('   tenantId:', user.privateMetadata?.tenantId);
    console.log('   isOnboarded:', user.privateMetadata?.isOnboarded);
    console.log('');
    
    console.log('🌐 PUBLIC Metadata:');
    console.log('   Raw:', JSON.stringify(user.publicMetadata, null, 2));
    console.log('   role:', user.publicMetadata?.role);
    console.log('   tenantId:', user.publicMetadata?.tenantId);
    console.log('   isOnboarded:', user.publicMetadata?.isOnboarded);
    console.log('');
    
    console.log('🔧 UNSAFE Metadata (should be empty):');
    console.log('   Raw:', JSON.stringify(user.unsafeMetadata, null, 2));
    console.log('');
    
    // Test role resolution logic (same as app)
    const privateMetadata = user.privateMetadata;
    const publicMetadata = user.publicMetadata;
    const resolvedRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
    
    console.log('⚙️ Role Resolution:');
    console.log('   privateMetadata.role:', privateMetadata?.role);
    console.log('   publicMetadata.role:', publicMetadata?.role);
    console.log('   Final resolved role:', resolvedRole);
    console.log('');
    
    // Check if we need to fix the metadata
    if (!privateMetadata?.role && publicMetadata?.role) {
      console.log('⚠️ SECURITY ISSUE DETECTED:');
      console.log('   Role is in PUBLIC metadata instead of PRIVATE');
      console.log('   This is a security vulnerability');
      console.log('');
      
      console.log('🔧 Fixing: Moving role to private metadata...');
      
      try {
        await clerk.users.updateUserMetadata(user.id, {
          privateMetadata: {
            ...privateMetadata,
            role: publicMetadata.role,
            tenantId: publicMetadata.tenantId,
            isOnboarded: publicMetadata.isOnboarded || true,
            isSuperAdmin: publicMetadata.role === 'SUPER_ADMIN'
          },
          publicMetadata: {
            // Remove sensitive data from public metadata
            tenantName: publicMetadata.tenantName,
            // Keep only non-sensitive display data
          }
        });
        
        console.log('✅ Metadata fixed - role moved to private metadata');
        console.log('🔒 Security vulnerability resolved');
        
      } catch (error) {
        console.error('❌ Failed to fix metadata:', error.message);
      }
    } else if (privateMetadata?.role) {
      console.log('✅ Security check passed:');
      console.log('   Role is correctly stored in PRIVATE metadata');
    } else {
      console.log('⚠️ No role found in either metadata');
      console.log('   User may need role assignment');
    }
    
  } catch (error) {
    console.error('❌ Error debugging user metadata:', error);
  }
}

debugUserMetadata();