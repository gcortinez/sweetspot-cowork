const { PrismaClient } = require('@prisma/client');
const { clerkClient } = require('@clerk/nextjs/server');

async function createProductionSuperAdmin() {
  console.log('🚀 Creating Production Super Admin...\n');
  
  // Configure these variables for the super admin
  const SUPER_ADMIN_EMAIL = process.argv[2] || 'admin@thesweetspot.cloud'; // Use provided email or default
  const SUPER_ADMIN_FIRST_NAME = 'Super';
  const SUPER_ADMIN_LAST_NAME = 'Admin';
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Check if Super Admin already exists in database
    console.log('1. Checking for existing Super Admin...');
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { 
        email: SUPER_ADMIN_EMAIL,
        role: 'SUPER_ADMIN',
        tenantId: null 
      }
    });
    
    if (existingSuperAdmin) {
      console.log('✅ Super Admin already exists in database:');
      console.log('   Email:', existingSuperAdmin.email);
      console.log('   Name:', existingSuperAdmin.firstName, existingSuperAdmin.lastName);
      console.log('   Role:', existingSuperAdmin.role);
      console.log('   Clerk ID:', existingSuperAdmin.clerkId);
      
      // Verify the Clerk user exists
      if (existingSuperAdmin.clerkId) {
        try {
          const clerk = await clerkClient();
          const clerkUser = await clerk.users.getUser(existingSuperAdmin.clerkId);
          console.log('   ✅ Clerk user confirmed');
          console.log('   📧 Can login at: https://sweetspot-cowork-4i3jx4jo8-get-sweet-spot.vercel.app');
          return;
        } catch (clerkError) {
          console.log('   ❌ Clerk user not found, will need to sync');
        }
      }
    }
    
    // Step 2: Check if user exists in Clerk
    console.log('\n2. Checking Clerk for user...');
    const clerk = await clerkClient();
    
    let clerkUser = null;
    try {
      const users = await clerk.users.getUserList({ emailAddress: [SUPER_ADMIN_EMAIL] });
      if (users.data && users.data.length > 0) {
        clerkUser = users.data[0];
        console.log('   ✅ User found in Clerk:', clerkUser.id);
      }
    } catch (error) {
      console.log('   ℹ️ User not found in Clerk (will create invitation)');
    }
    
    // Step 3: Create or update database user
    console.log('\n3. Creating/updating Super Admin in database...');
    
    let dbUser;
    if (existingSuperAdmin && clerkUser) {
      // Update existing user with Clerk ID
      dbUser = await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: {
          clerkId: clerkUser.id,
          firstName: clerkUser.firstName || SUPER_ADMIN_FIRST_NAME,
          lastName: clerkUser.lastName || SUPER_ADMIN_LAST_NAME,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });
      console.log('   ✅ Updated existing Super Admin with Clerk ID');
    } else if (clerkUser) {
      // Create new database user with existing Clerk user
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: SUPER_ADMIN_EMAIL,
          firstName: clerkUser.firstName || SUPER_ADMIN_FIRST_NAME,
          lastName: clerkUser.lastName || SUPER_ADMIN_LAST_NAME,
          role: 'SUPER_ADMIN',
          tenantId: null, // Super Admin belongs to no specific tenant
          status: 'ACTIVE'
        }
      });
      console.log('   ✅ Created new Super Admin with existing Clerk user');
    } else {
      // Create invitation for new user
      console.log('\n4. Creating invitation for new Super Admin...');
      
      try {
        const invitation = await clerk.invitations.createInvitation({
          emailAddress: SUPER_ADMIN_EMAIL,
          redirectUrl: 'https://sweetspot-cowork-4i3jx4jo8-get-sweet-spot.vercel.app/invitation/accept',
          publicMetadata: {
            role: 'SUPER_ADMIN',
            tenantId: null,
            tenantName: 'SweetSpot Platform',
            invitationType: 'super_admin_setup'
          },
          notify: true,
          ignoreExisting: true
        });
        
        console.log('   ✅ Clerk invitation created:', invitation.id);
        
        // Create database invitation record
        await prisma.invitation.create({
          data: {
            id: invitation.id,
            email: SUPER_ADMIN_EMAIL,
            role: 'SUPER_ADMIN',
            tenantId: null,
            status: 'PENDING',
            invitedBy: 'system', // System-generated invitation
            clerkInvitationId: invitation.id
          }
        });
        
        console.log('   ✅ Database invitation record created');
        console.log('   📧 Invitation email sent to:', SUPER_ADMIN_EMAIL);
        console.log('   🔗 The user will receive an email to complete registration');
        
      } catch (invitationError) {
        console.error('   ❌ Failed to create invitation:', invitationError.message);
        throw invitationError;
      }
    }
    
    // Step 4: Update Clerk metadata if user exists
    if (clerkUser) {
      console.log('\n5. Updating Clerk user metadata...');
      try {
        await clerk.users.updateUserMetadata(clerkUser.id, {
          privateMetadata: {
            role: 'SUPER_ADMIN',
            tenantId: null,
            isSuperAdmin: true
          },
          publicMetadata: {
            role: 'SUPER_ADMIN',
            tenantId: null,
            tenantName: 'SweetSpot Platform'
          }
        });
        console.log('   ✅ Clerk metadata updated');
      } catch (metadataError) {
        console.log('   ⚠️ Could not update Clerk metadata:', metadataError.message);
      }
    }
    
    console.log('\n🎉 SUCCESS! Super Admin setup completed');
    
    if (dbUser || existingSuperAdmin) {
      console.log('\n📊 Super Admin Details:');
      const admin = dbUser || existingSuperAdmin;
      console.log('   ID:', admin.id);
      console.log('   Email:', admin.email);
      console.log('   Name:', admin.firstName, admin.lastName);
      console.log('   Role:', admin.role);
      console.log('   Tenant ID:', admin.tenantId || 'null (Platform Admin)');
      console.log('   Clerk ID:', admin.clerkId || 'Pending registration');
      console.log('\n🌐 Login URL: https://sweetspot-cowork-4i3jx4jo8-get-sweet-spot.vercel.app');
    } else {
      console.log('\n📧 An invitation has been sent to:', SUPER_ADMIN_EMAIL);
      console.log('   Check your email and follow the registration link');
    }
    
  } catch (error) {
    console.error('\n❌ Error creating Super Admin:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Validate email parameter
if (!process.argv[2]) {
  console.log('⚠️ No email provided, using default: admin@thesweetspot.cloud');
  console.log('💡 Usage: npm run create-super-admin your@email.com');
} else {
  console.log('📧 Using provided email:', process.argv[2]);
}

createProductionSuperAdmin();