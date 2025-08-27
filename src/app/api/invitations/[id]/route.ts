import { NextRequest, NextResponse } from 'next/server'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'
import { logger } from '@/lib/logger'

/**
 * Individual Invitation Operations API
 * DELETE - Delete/revoke invitation
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Check authentication first
    const clerkUser = await currentUser()
    logger.logAPICall(`/api/invitations/${id}`, 'DELETE', clerkUser?.id)
    
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
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Find invitation in database
    const invitation = await prisma.invitation.findUnique({
      where: { id }
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Try to revoke in Clerk - check both by ID and by email
    let clerkRevoked = false
    
    // First try with stored clerkInvitationId
    if (invitation.clerkInvitationId) {
      try {
        const clerk = await clerkClient()
        await clerk.invitations.revokeInvitation(invitation.clerkInvitationId)
        logger.info('Invitation revoked in Clerk by ID', { clerkInvitationId: invitation.clerkInvitationId, email: invitation.email })
        clerkRevoked = true
      } catch (clerkError: any) {
        if (clerkError.status !== 404) {
          logger.warn('Failed to revoke invitation in Clerk by ID', { error: clerkError.message, clerkInvitationId: invitation.clerkInvitationId })
        }
      }
    }
    
    // If not revoked yet, search for the invitation by email
    if (!clerkRevoked) {
      try {
        logger.debug('Searching for invitation by email', { email: invitation.email })
        const clerk = await clerkClient()
        const clerkInvitations = await clerk.invitations.getInvitationList()
        const pendingInvitation = clerkInvitations.find(
          inv => inv.emailAddress === invitation.email && inv.status === 'pending'
        )
        
        if (pendingInvitation) {
          await clerk.invitations.revokeInvitation(pendingInvitation.id)
          logger.info('Invitation revoked in Clerk by email search', { clerkInvitationId: pendingInvitation.id, email: invitation.email })
          clerkRevoked = true
        } else {
          logger.info('No pending invitation found in Clerk', { email: invitation.email })
        }
      } catch (searchError: any) {
        logger.warn('Failed to search/revoke invitation in Clerk', { error: searchError.message, email: invitation.email })
      }
    }

    // Delete invitation from database (instead of just updating status)
    await prisma.invitation.delete({
      where: { id }
    })

    logger.info('Invitation deleted from database', { invitationId: id, email: invitation.email, clerkRevoked })

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully'
    })

  } catch (error: any) {
    const { id: invitationId } = params
    logger.error('Unified invitation DELETE API error', error, { invitationId })
    return NextResponse.json(
      { success: false, error: 'Failed to revoke invitation' },
      { status: 500 }
    )
  }
}