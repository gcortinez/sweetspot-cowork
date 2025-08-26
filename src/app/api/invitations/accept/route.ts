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
    
    console.log('📝 Processing invitation acceptance for:', email, 'clerkId:', userId)
    
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
    
    console.log('🔍 Found', invitations.length, 'pending invitations')
    
    // Check if user already exists in our database
    let user = await prisma.user.findFirst({
      where: { clerkId: userId }
    })
    
    // If user doesn't exist, create them based on the invitation
    if (!user) {
      console.log('👤 User not found in database, creating from invitation data')
      
      // Use the first invitation to create the user (they should all have the same basic info)
      const primaryInvitation = invitations[0]
      
      try {
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email: email,
            firstName: '', // Will be updated from Clerk if available
            lastName: '', // Will be updated from Clerk if available
            role: primaryInvitation.role as any,
            tenantId: primaryInvitation.tenantId,
            status: 'ACTIVE'
          }
        })
        console.log('✅ User created in database:', user.id)
      } catch (createError) {
        console.error('❌ Failed to create user:', createError)
        return NextResponse.json(
          { success: false, error: 'Failed to create user record' },
          { status: 500 }
        )
      }
    } else {
      console.log('👤 User already exists in database:', user.id)
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
    
    console.log('✅ Updated', updated.count, 'invitations to ACCEPTED status')
    
    return NextResponse.json({
      success: true,
      message: `Invitation accepted successfully`,
      updatedCount: updated.count,
      userId: user.id
    })
    
  } catch (error) {
    console.error('❌ Error accepting invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update invitation status' },
      { status: 500 }
    )
  }
}