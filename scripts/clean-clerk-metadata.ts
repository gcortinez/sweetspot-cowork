import { clerkClient } from '@clerk/nextjs/server'

async function cleanClerkMetadata() {
  try {
    console.log('🧹 Cleaning sensitive data from Clerk public metadata...');

    const clerk = await clerkClient()

    // Find users with role in public metadata
    const users = await clerk.users.getUserList({
      limit: 100
    })

    console.log(`📊 Found ${users.totalCount} total users`);

    let cleanedCount = 0

    for (const user of users.data) {
      const publicMetadata = user.publicMetadata as any
      const privateMetadata = user.privateMetadata as any

      // Check if user has sensitive data in public metadata
      if (publicMetadata.role || publicMetadata.tenantId) {
        console.log(`🔧 Cleaning user: ${user.emailAddresses[0]?.emailAddress}`);
        console.log(`   Current public metadata:`, publicMetadata);

        // Move sensitive data to private metadata
        const newPrivateMetadata = {
          ...privateMetadata,
          role: publicMetadata.role || privateMetadata.role,
          tenantId: publicMetadata.tenantId || privateMetadata.tenantId,
          onboardingComplete: publicMetadata.onboardingComplete || privateMetadata.onboardingComplete,
        }

        // Keep only non-sensitive data in public metadata
        const newPublicMetadata = {
          onboardingComplete: publicMetadata.onboardingComplete,
          onboardingCompletedAt: publicMetadata.onboardingCompletedAt,
          invitationDate: publicMetadata.invitationDate,
          tenantName: publicMetadata.tenantName, // Name is not sensitive
          // Remove sensitive fields
          role: undefined,
          tenantId: undefined,
          invitedBy: undefined
        }

        // Clean undefined values
        Object.keys(newPublicMetadata).forEach(key => {
          if (newPublicMetadata[key] === undefined) {
            delete newPublicMetadata[key]
          }
        })

        try {
          await clerk.users.updateUserMetadata(user.id, {
            privateMetadata: newPrivateMetadata,
            publicMetadata: newPublicMetadata
          })

          console.log(`✅ Cleaned user: ${user.emailAddresses[0]?.emailAddress}`);
          console.log(`   New private metadata:`, newPrivateMetadata);
          console.log(`   New public metadata:`, newPublicMetadata);
          cleanedCount++
        } catch (error) {
          console.error(`❌ Error cleaning user ${user.emailAddresses[0]?.emailAddress}:`, error);
        }
      } else {
        console.log(`✓ User already secure: ${user.emailAddresses[0]?.emailAddress}`);
      }
    }

    console.log(`\n🎉 Cleanup completed! Cleaned ${cleanedCount} users`);

  } catch (error) {
    console.error('❌ Error cleaning Clerk metadata:', error);
  }
}

cleanClerkMetadata();