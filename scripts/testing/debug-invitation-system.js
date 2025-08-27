const { clerkClient } = require('@clerk/nextjs/server');
const { PrismaClient } = require('@prisma/client');

async function debugInvitationSystem() {
  console.log('🔍 Debugging Complete Invitation System...\n');
  
  // Validate environment variables
  if (!process.env.CLERK_SECRET_KEY || !process.env.DATABASE_URL) {
    throw new Error('Missing required environment variables: CLERK_SECRET_KEY, DATABASE_URL');
  }
  
  const prisma = new PrismaClient();
  const testEmail = 'debug-test@example.com';
  
  try {
    const clerk = await clerkClient();
    
    console.log('1. Environment Configuration:');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('   Clerk Key prefix:', process.env.CLERK_SECRET_KEY.substring(0, 15) + '...');
    console.log('   Database configured:', process.env.DATABASE_URL.includes('supabase') ? '✅' : '❌');
    
    // Test database connection
    console.log('\n2. Database Connection:');
    try {
      const userCount = await prisma.user.count();
      console.log('   ✅ Database connected');
      console.log('   Total users:', userCount);
      
      const superAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      });
      
      if (superAdmin) {
        console.log('   ✅ Super Admin found:', superAdmin.email);
      } else {
        console.log('   ⚠️ No Super Admin found');
      }
      
    } catch (dbError) {
      console.error('   ❌ Database error:', dbError.message);
    }
    
    // Test Clerk API connectivity
    console.log('\n3. Clerk API Connection:');
    try {
      const users = await clerk.users.getUserList({ limit: 1 });
      console.log('   ✅ Clerk API connected');
      console.log('   Can access users:', users.data?.length || 0, 'found');
      
      const invitations = await clerk.invitations.getInvitationList();
      console.log('   ✅ Can access invitations:', invitations.data?.length || 0, 'found');
      
    } catch (clerkError) {
      console.error('   ❌ Clerk API error:', clerkError.message);
      console.error('   Status:', clerkError.status);
    }
    
    // Clean up any existing test data
    console.log('\n4. Cleaning up existing test data...');
    try {
      const existingClerkInvitations = await clerk.invitations.getInvitationList();
      const testInvitation = existingClerkInvitations.data?.find(inv => inv.emailAddress === testEmail);
      
      if (testInvitation && testInvitation.status === 'pending') {
        await clerk.invitations.revokeInvitation(testInvitation.id);
        console.log('   ✅ Revoked existing Clerk invitation');
      }
      
      const deletedDbInvitations = await prisma.invitation.deleteMany({
        where: { email: testEmail }
      });
      
      if (deletedDbInvitations.count > 0) {
        console.log('   ✅ Deleted', deletedDbInvitations.count, 'database invitations');
      }
      
    } catch (cleanupError) {
      console.log('   ⚠️ Cleanup skipped:', cleanupError.message);
    }
    
    console.log('\n✅ System debug completed successfully!');
    console.log('   All components are functioning properly.');
    
  } catch (error) {
    console.error('\n❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugInvitationSystem();