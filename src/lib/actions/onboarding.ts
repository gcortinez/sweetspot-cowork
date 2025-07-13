'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Complete user onboarding after invitation acceptance
 */
export async function completeOnboarding(userData: {
  firstName?: string
  lastName?: string
  phone?: string
}) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }

    // Get current user from Clerk
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    
    if (!clerkUser) {
      return { success: false, error: 'User not found' }
    }

    // Get invitation metadata from Clerk user
    const publicMetadata = clerkUser.publicMetadata as any
    const role = publicMetadata?.role || 'END_USER'
    const tenantId = publicMetadata?.tenantId || null
    const invitedBy = publicMetadata?.invitedBy || null

    // Check if user already exists in our database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      // Create new user in our database
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: userData.firstName || clerkUser.firstName || '',
          lastName: userData.lastName || clerkUser.lastName || '',
          phone: userData.phone || null,
          role: role,
          status: 'ACTIVE',
          tenantId: tenantId,
          isOnboarded: true,
          lastLoginAt: new Date()
        }
      })

      console.log('✅ User created from invitation:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      })
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: userData.firstName || user.firstName,
          lastName: userData.lastName || user.lastName,
          phone: userData.phone || user.phone,
          role: role, // Update role from invitation
          tenantId: tenantId, // Update tenant from invitation
          isOnboarded: true,
          lastLoginAt: new Date()
        }
      })

      console.log('✅ User updated from invitation:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      })
    }

    // Update invitation status if we can find it
    if (clerkUser.emailAddresses[0]?.emailAddress) {
      await prisma.invitation.updateMany({
        where: {
          email: clerkUser.emailAddresses[0].emailAddress,
          status: 'PENDING'
        },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      })
    }

    // Update Clerk user metadata to mark onboarding as complete
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...publicMetadata,
        onboardingComplete: true,
        role: role,
        tenantId: tenantId
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/admin/users')

    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    }

  } catch (error) {
    console.error('❌ Error completing onboarding:', error)
    return { success: false, error: 'Failed to complete onboarding' }
  }
}

/**
 * Get user onboarding status
 */
export async function getOnboardingStatus() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }

    // Get user from Clerk
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    
    if (!clerkUser) {
      return { success: false, error: 'User not found' }
    }

    const publicMetadata = clerkUser.publicMetadata as any
    const isOnboardingComplete = publicMetadata?.onboardingComplete || false
    
    // Get user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return {
      success: true,
      onboardingComplete: isOnboardingComplete,
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name
      } : null,
      invitationData: {
        role: publicMetadata?.role,
        tenantId: publicMetadata?.tenantId,
        tenantName: publicMetadata?.tenantName,
        invitedBy: publicMetadata?.invitedBy
      }
    }

  } catch (error) {
    console.error('❌ Error getting onboarding status:', error)
    return { success: false, error: 'Failed to get onboarding status' }
  }
}