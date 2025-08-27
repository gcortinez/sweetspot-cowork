import { NextRequest, NextResponse } from 'next/server'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'

/**
 * Resend Invitation API
 * POST - Resend a pending invitation
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('📧 Unified invitation RESEND API called for:', id)
    
    // Check authentication
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
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Find invitation in database
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: { tenant: { select: { name: true } } }
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Only pending invitations can be resent' },
        { status: 400 }
      )
    }

    // Check if Clerk invitation still exists
    let clerkInvitation = null
    try {
      const clerk = await clerkClient()
      clerkInvitation = await clerk.invitations.getInvitation(invitation.clerkInvitationId)
    } catch (error: any) {
      if (error.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Invitation no longer exists in Clerk. Please create a new one.' },
          { status: 404 }
        )
      }
      throw error
    }

    if (clerkInvitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Invitation is no longer pending in Clerk' },
        { status: 400 }
      )
    }

    // Resend the invitation through Clerk (this doesn't have a direct API, so we'll create a new one)
    // Since Clerk doesn't have a direct resend API, we need to revoke and recreate
    const clerk2 = await clerkClient()
    await clerk2.invitations.revokeInvitation(invitation.clerkInvitationId)

    // Create new invitation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const newClerkInvitation = await clerk2.invitations.createInvitation({
      emailAddress: invitation.email,
      redirectUrl: `${appUrl}/accept-invitation`,
      publicMetadata: {
        role: invitation.role,
        tenantId: invitation.tenantId,
        tenantName: invitation.tenant?.name || 'SweetSpot Cowork',
        invitedBy: invitation.invitedBy,
        invitationDate: new Date().toISOString()
      },
      notify: true,
      ignoreExisting: false
    })

    // Update database with new Clerk invitation ID
    await prisma.invitation.update({
      where: { id },
      data: {
        clerkInvitationId: newClerkInvitation.id,
        updatedAt: new Date()
      }
    })

    console.log('✅ Invitation resent successfully:', id)

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully'
    })

  } catch (error: any) {
    console.error('❌ Unified invitation RESEND API error:', error)
    
    // Handle Clerk-specific errors
    if (error.errors?.[0]?.code === 'duplicate_record') {
      return NextResponse.json(
        { success: false, error: 'Ya existe una invitación pendiente para este email' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to resend invitation' },
      { status: 500 }
    )
  }
}