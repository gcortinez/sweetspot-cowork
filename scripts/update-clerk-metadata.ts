import { createClerkClient } from '@clerk/nextjs/server'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

console.log('🔍 Environment check:');
console.log('CLERK_SECRET_KEY exists:', !!CLERK_SECRET_KEY);
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY not found in environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('CLERK')));
  process.exit(1);
}

// Create Clerk client instance
const clerkClient = createClerkClient({
  secretKey: CLERK_SECRET_KEY
});

async function updateClerkMetadata() {
  try {
    console.log('🔍 Looking for user: gcortinez@getsweetspot.io');

    // Find user by email
    const users = await clerkClient.users.getUserList({
      emailAddress: ['gcortinez@getsweetspot.io']
    });

    if (users.data.length === 0) {
      console.error('❌ User not found in Clerk');
      return;
    }

    const user = users.data[0];
    console.log('✅ Found Clerk user:', {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      currentPrivateMetadata: user.privateMetadata,
      currentPublicMetadata: user.publicMetadata
    });

    // Update private metadata with Super Admin info
    const updatedUser = await clerkClient.users.updateUser(user.id, {
      privateMetadata: {
        ...user.privateMetadata,
        role: 'SUPER_ADMIN',
        tenantName: 'SweetSpot Platform',
        isOnboarded: true,
        isSuperAdmin: true
      },
      publicMetadata: {
        ...user.publicMetadata,
        isOnboarded: true
      }
    });

    console.log('✅ User metadata updated successfully:', {
      id: updatedUser.id,
      email: updatedUser.emailAddresses[0]?.emailAddress,
      privateMetadata: updatedUser.privateMetadata,
      publicMetadata: updatedUser.publicMetadata
    });

    console.log('\n🎉 Super Admin metadata configured in Clerk!');
    console.log('Please refresh your browser to see the changes.');

  } catch (error) {
    console.error('❌ Error updating Clerk metadata:', error);
  }
}

updateClerkMetadata();