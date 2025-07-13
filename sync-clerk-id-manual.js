const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncClerkIdManual() {
  try {
    console.log('🔗 Manual Clerk ID sync...');
    
    // Get the user that needs clerk ID update
    const user = await prisma.user.findFirst({
      where: { 
        email: 'gcortinez@getsweetspot.io',
        clerkId: null
      }
    });
    
    if (!user) {
      console.log('✅ User not found or already has clerkId');
      return;
    }
    
    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Current clerkId: ${user.clerkId}`);
    
    // For manual sync, you'd need to provide the actual Clerk ID
    // You can get this from the Clerk dashboard or from the browser console
    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log('1. Go to https://dashboard.clerk.com/');
    console.log('2. Find the user gcortinez@getsweetspot.io');
    console.log('3. Copy the User ID');
    console.log('4. Update this script with the correct Clerk ID');
    console.log('5. Uncomment the update code below\n');
    
    // Example Clerk ID (you need to replace this with the actual one)
    const ACTUAL_CLERK_ID = 'user_xxxxxxxxxxxxxxxxx'; // REPLACE THIS
    
    // Uncomment these lines and add the real Clerk ID:
    /*
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        clerkId: ACTUAL_CLERK_ID,
        lastLoginAt: new Date()
      }
    });
    
    console.log('✅ Updated user:', updatedUser.email);
    console.log('✅ New clerkId:', updatedUser.clerkId);
    */
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncClerkIdManual();