'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'
import { revalidatePath } from 'next/cache'

export interface InvitationData {
  id: string
  emailAddress: string
  status: 'pending' | 'accepted' | 'revoked'
  role: string
  tenantId?: string
  tenantName?: string
  createdAt: string
  updatedAt: string
  invitedBy: string
  acceptedAt?: string
}

/**
 * Create a new user invitation
 */
export async function createInvitation(data: {
  emailAddress: string
  role: 'SUPER_ADMIN' | 'COWORK_ADMIN' | 'CLIENT_ADMIN' | 'END_USER'
  tenantId?: string
}) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }

    // Get current user from our database to verify permissions and get ID
    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentDbUser) {
      return { success: false, error: 'User not found in database' }
    }

    // Check permissions
    const isAdmin = currentDbUser.role === 'SUPER_ADMIN' || currentDbUser.role === 'COWORK_ADMIN'
    if (!isAdmin) {
      return { success: false, error: 'Insufficient permissions' }
    }
    
    // COWORK_ADMIN can only invite to their own cowork
    if (currentDbUser.role === 'COWORK_ADMIN') {
      if (!currentDbUser.tenantId) {
        return { success: false, error: 'Cowork admin must have a tenant assigned' }
      }
      // Override tenantId with their own tenant
      data.tenantId = currentDbUser.tenantId
      
      // COWORK_ADMIN can only assign CLIENT_ADMIN or END_USER roles
      if (data.role === 'SUPER_ADMIN' || data.role === 'COWORK_ADMIN') {
        return { success: false, error: 'Cannot assign admin roles' }
      }
    }

    // Also get Clerk user for API calls
    const client = await clerkClient()
    const currentUser = await client.users.getUser(userId)

    // Check if email already exists in our database
    const existingUser = await prisma.user.findFirst({
      where: { email: data.emailAddress }
    })

    if (existingUser) {
      return { success: false, error: 'User already exists in the system' }
    }

    // Get tenant info if specified
    let tenantInfo = null
    if (data.tenantId) {
      tenantInfo = await prisma.tenant.findUnique({
        where: { id: data.tenantId },
        select: { id: true, name: true }
      })
      
      if (!tenantInfo) {
        return { success: false, error: 'Invalid cowork selected' }
      }
    }

    // Create invitation via Clerk
    const clerkInvitation = await client.invitations.createInvitation({
      emailAddress: data.emailAddress,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation`,
      publicMetadata: {
        role: data.role,
        tenantId: data.tenantId || null,
        tenantName: tenantInfo?.name || 'Plataforma',
        invitedBy: currentDbUser.id,
        invitationDate: new Date().toISOString()
      },
      notify: true, // Send email automatically
      ignoreExisting: false // Prevent duplicate invitations
    })

    // Store invitation in our database for tracking
    const invitation = await prisma.invitation.create({
      data: {
        id: clerkInvitation.id,
        email: data.emailAddress,
        role: data.role,
        tenantId: data.tenantId,
        status: 'PENDING',
        invitedBy: currentDbUser.id,
        clerkInvitationId: clerkInvitation.id
      }
    })

    console.log('✅ Invitation created:', {
      id: invitation.id,
      email: data.emailAddress,
      role: data.role,
      tenantId: data.tenantId
    })

    revalidatePath('/dashboard/admin/users')
    
    return { 
      success: true, 
      invitation: {
        id: invitation.id,
        emailAddress: data.emailAddress,
        status: 'pending' as const,
        role: data.role,
        tenantId: data.tenantId,
        tenantName: tenantInfo?.name || 'Plataforma',
        createdAt: invitation.createdAt.toISOString(),
        invitedBy: currentDbUser.id
      }
    }

  } catch (error: any) {
    console.error('❌ Error creating invitation:', error)
    
    // Handle specific Clerk errors
    if (error.errors?.[0]?.code === 'duplicate_record') {
      return { success: false, error: 'An invitation for this email already exists' }
    }
    
    if (error.errors?.[0]?.code === 'invalid_email_address') {
      return { success: false, error: 'Invalid email address' }
    }
    
    return { success: false, error: 'Failed to create invitation' }
  }
}

/**
 * Get all invitations for the platform
 */
export async function getInvitations(status?: 'pending' | 'accepted' | 'revoked') {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }

    // Get current user from our database to verify permissions
    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentDbUser) {
      return { success: false, error: 'User not found in database' }
    }

    if (currentDbUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get invitations from our database
    const whereClause: any = {}
    if (status) {
      whereClause.status = status.toUpperCase()
    }

    const invitations = await prisma.invitation.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        },
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedInvitations: InvitationData[] = invitations.map(inv => ({
      id: inv.id,
      emailAddress: inv.email,
      status: inv.status.toLowerCase() as 'pending' | 'accepted' | 'revoked',
      role: inv.role,
      tenantId: inv.tenantId,
      tenantName: inv.tenant?.name || 'Plataforma',
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
      invitedBy: `${inv.inviter?.firstName} ${inv.inviter?.lastName}` || inv.invitedBy,
      acceptedAt: inv.acceptedAt?.toISOString()
    }))

    return { success: true, invitations: formattedInvitations }

  } catch (error) {
    console.error('❌ Error getting invitations:', error)
    return { success: false, error: 'Failed to fetch invitations' }
  }
}

/**
 * Resend an invitation
 */
export async function resendInvitation(invitationId: string) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }

    // Get current user from our database to verify permissions
    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentDbUser) {
      return { success: false, error: 'User not found in database' }
    }

    if (currentDbUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get Clerk client for API calls
    const client = await clerkClient()

    // Get invitation from database
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        tenant: {
          select: { name: true }
        }
      }
    })

    if (!invitation) {
      return { success: false, error: 'Invitation not found' }
    }

    if (invitation.status !== 'PENDING') {
      return { success: false, error: 'Can only resend pending invitations' }
    }

    // Create new Clerk invitation (previous one might be expired)
    const clerkInvitation = await client.invitations.createInvitation({
      emailAddress: invitation.email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation`,
      publicMetadata: {
        role: invitation.role,
        tenantId: invitation.tenantId,
        tenantName: invitation.tenant?.name || 'Plataforma',
        invitedBy: currentDbUser.id,
        invitationDate: new Date().toISOString(),
        resent: true
      },
      notify: true,
      ignoreExisting: true // Allow resending to same email
    })

    // Update our database record
    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        clerkInvitationId: clerkInvitation.id,
        updatedAt: new Date()
      }
    })

    console.log('✅ Invitation resent:', invitation.email)
    
    revalidatePath('/dashboard/admin/users')
    
    return { success: true, message: 'Invitation resent successfully' }

  } catch (error: any) {
    console.error('❌ Error resending invitation:', error)
    
    if (error.errors?.[0]?.code === 'duplicate_record') {
      return { success: false, error: 'A recent invitation for this email already exists' }
    }
    
    return { success: false, error: 'Failed to resend invitation' }
  }
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId: string) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }

    // Get current user from our database to verify permissions
    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!currentDbUser) {
      return { success: false, error: 'User not found in database' }
    }

    if (currentDbUser.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get Clerk client for API calls
    const client = await clerkClient()

    // Get invitation from database
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    })

    if (!invitation) {
      return { success: false, error: 'Invitation not found' }
    }

    if (invitation.status !== 'PENDING') {
      return { success: false, error: 'Can only revoke pending invitations' }
    }

    // Revoke in Clerk
    await client.invitations.revokeInvitation(invitation.clerkInvitationId)

    // Update our database
    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: 'REVOKED',
        updatedAt: new Date()
      }
    })

    console.log('✅ Invitation revoked:', invitation.email)
    
    revalidatePath('/dashboard/admin/users')
    
    return { success: true, message: 'Invitation revoked successfully' }

  } catch (error) {
    console.error('❌ Error revoking invitation:', error)
    return { success: false, error: 'Failed to revoke invitation' }
  }
}