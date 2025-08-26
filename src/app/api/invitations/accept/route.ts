import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/server/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }
    
    console.log('📝 Updating invitation status for:', email)
    
    // Find all pending invitations for this email
    const invitations = await prisma.invitation.findMany({
      where: {
        email,
        status: 'PENDING'
      }
    })
    
    if (invitations.length === 0) {
      console.log('⚠️ No pending invitations found for:', email)
      return NextResponse.json(
        { success: true, message: 'No pending invitations to update' }
      )
    }
    
    // Update all pending invitations to accepted
    const updated = await prisma.invitation.updateMany({
      where: {
        email,
        status: 'PENDING'
      },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Updated invitations:', updated.count)
    
    // Find the user record created from this invitation
    const user = await prisma.user.findFirst({
      where: { clerkId: userId }
    })
    
    if (user) {
      // If we have multiple invitations, log which tenant the user joined
      const invitation = invitations.find(inv => inv.tenantId === user.tenantId)
      if (invitation) {
        console.log('✅ User joined tenant:', invitation.tenantId)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Invitation accepted successfully`,
      updatedCount: updated.count
    })
    
  } catch (error) {
    console.error('❌ Error accepting invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update invitation status' },
      { status: 500 }
    )
  }
}