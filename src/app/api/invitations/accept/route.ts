import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { InvitationService } from '@/services/invitation.service'

/**
 * Unified Accept Invitation API
 * Uses the centralized InvitationService for accepting invitations
 */
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
    
    console.log('📝 Unified invitation accept API called for:', email, 'clerkId:', userId)
    
    // Get user data from Clerk to pass to the service
    let userData = {}
    try {
      const clerkUser = await clerkClient.users.getUser(userId)
      userData = {
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        email: email,
        clerkId: userId
      }
    } catch (clerkError) {
      console.warn('⚠️ Could not fetch user data from Clerk:', clerkError)
      userData = {
        firstName: '',
        lastName: '',
        email: email,
        clerkId: userId
      }
    }
    
    // Use the centralized InvitationService
    const invitationService = InvitationService.getInstance()
    const result = await invitationService.acceptInvitation(email, userId, userData)
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      updatedCount: result.updatedCount,
      userId: result.userId
    })
    
  } catch (error: any) {
    console.error('❌ Unified invitation accept API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}