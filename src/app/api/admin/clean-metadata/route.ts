import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'

/**
 * Clean sensitive data from Clerk public metadata
 * IMPORTANT: Only accessible to Super Admins
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Admin metadata cleanup requested');

    // Get the current user from Clerk
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is Super Admin
    const privateMetadata = clerkUser.privateMetadata as any
    const publicMetadata = clerkUser.publicMetadata as any
    const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER'

    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions - Super Admin required' },
        { status: 403 }
      )
    }

    const clerk = await clerkClient()

    // Find users with role in public metadata
    const users = await clerk.users.getUserList({
      limit: 100
    })

    console.log(`📊 Found ${users.totalCount} total users`);

    let cleanedCount = 0
    const results = []

    for (const user of users.data) {
      const currentPublicMetadata = user.publicMetadata as any
      const currentPrivateMetadata = user.privateMetadata as any
      const email = user.emailAddresses[0]?.emailAddress

      // Check if user has sensitive data in public metadata
      if (currentPublicMetadata.role || currentPublicMetadata.tenantId) {
        console.log(`🔧 Cleaning user: ${email}`);

        // Move sensitive data to private metadata
        const newPrivateMetadata = {
          ...currentPrivateMetadata,
          role: currentPublicMetadata.role || currentPrivateMetadata.role,
          tenantId: currentPublicMetadata.tenantId || currentPrivateMetadata.tenantId,
          onboardingComplete: currentPublicMetadata.onboardingComplete || currentPrivateMetadata.onboardingComplete,
          invitedBy: currentPublicMetadata.invitedBy || currentPrivateMetadata.invitedBy
        }

        // Keep only non-sensitive data in public metadata
        const newPublicMetadata = {
          onboardingComplete: currentPublicMetadata.onboardingComplete,
          onboardingCompletedAt: currentPublicMetadata.onboardingCompletedAt,
          invitationDate: currentPublicMetadata.invitationDate,
          tenantName: currentPublicMetadata.tenantName, // Name is not sensitive
        }

        // Clean undefined/null values from public metadata
        Object.keys(newPublicMetadata).forEach(key => {
          if (newPublicMetadata[key] === undefined || newPublicMetadata[key] === null) {
            delete newPublicMetadata[key]
          }
        })

        try {
          await clerk.users.updateUserMetadata(user.id, {
            privateMetadata: newPrivateMetadata,
            publicMetadata: newPublicMetadata
          })

          console.log(`✅ Cleaned user: ${email}`);
          results.push({
            email,
            status: 'cleaned',
            message: 'Sensitive data moved from public to private metadata'
          })
          cleanedCount++
        } catch (error) {
          console.error(`❌ Error cleaning user ${email}:`, error);
          results.push({
            email,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      } else {
        results.push({
          email,
          status: 'already_secure',
          message: 'No sensitive data found in public metadata'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Metadata cleanup completed. Cleaned ${cleanedCount} users out of ${users.totalCount} total users.`,
      cleanedCount,
      totalUsers: users.totalCount,
      results
    })

  } catch (error) {
    console.error('Admin metadata cleanup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean metadata' },
      { status: 500 }
    );
  }
}