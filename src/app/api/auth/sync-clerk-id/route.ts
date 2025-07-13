import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'

/**
 * Sync Clerk ID with database user record
 * This endpoint updates the clerkId field in the database when a user logs in
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Syncing Clerk ID with database...');
    
    // Get the current user from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      console.log('🔗 No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('🔗 Clerk user:', clerkUser.id, clerkUser.emailAddresses[0]?.emailAddress);

    // Get user email
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      )
    }

    // Find existing user by email
    const existingUser = await prisma.user.findFirst({
      where: { email: email }
    });

    if (!existingUser) {
      console.log('🔗 User not found in database:', email);
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Update the clerkId if it's different or null
    if (existingUser.clerkId !== clerkUser.id) {
      console.log('🔗 Updating clerkId for user:', email, 'from', existingUser.clerkId, 'to', clerkUser.id);
      
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          clerkId: clerkUser.id,
          // Also update other fields if needed
          firstName: clerkUser.firstName || existingUser.firstName,
          lastName: clerkUser.lastName || existingUser.lastName,
          lastLoginAt: new Date()
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          clerkId: true,
          tenantId: true
        }
      });

      console.log('✅ Successfully synced clerkId for:', email);
      
      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: 'Clerk ID synced successfully'
      });
    } else {
      console.log('🔗 Clerk ID already synced for:', email);
      
      // Just update last login
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() }
      });
      
      return NextResponse.json({
        success: true,
        user: existingUser,
        message: 'Clerk ID already synced'
      });
    }

  } catch (error) {
    console.error('Sync Clerk ID error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync Clerk ID' },
      { status: 500 }
    );
  }
}