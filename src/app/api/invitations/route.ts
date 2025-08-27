import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { InvitationService } from '@/services/invitation.service'
import { logger } from '@/lib/logger'

/**
 * Unified Invitations API
 * GET - List invitations
 * POST - Create invitation
 */

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const clerkUser = await currentUser()
    logger.logAPICall('/api/invitations', 'GET', clerkUser?.id)
    
    if (!clerkUser) {
      logger.warn('Unauthenticated request to GET /api/invitations')
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

    // Get status filter from query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'PENDING' | 'ACCEPTED' | 'REVOKED' | null

    // Use server actions for now until they're refactored to use InvitationService
    const { getInvitations } = await import('@/lib/actions/invitations')
    const response = await getInvitations(status || undefined)
    
    if (response.success) {
      return NextResponse.json({
        success: true,
        invitations: response.invitations
      })
    } else {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: response.error === 'Authentication required' ? 401 : 
                 response.error === 'Insufficient permissions' ? 403 : 500 }
      )
    }

  } catch (error) {
    logger.error('Unified invitations GET API error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let emailAddress: string | undefined
  let role: string | undefined
  let tenantId: string | undefined
  
  try {
    // Check authentication
    const clerkUser = await currentUser()
    logger.logAPICall('/api/invitations', 'POST', clerkUser?.id)
    
    if (!clerkUser) {
      logger.warn('Unauthenticated request to POST /api/invitations')
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
    
    const body = await request.json()
    emailAddress = body.emailAddress
    role = body.role
    tenantId = body.tenantId
    const { redirectUrl } = body
    
    // Validate required fields
    if (!emailAddress || !role) {
      return NextResponse.json(
        { success: false, error: 'Email address and role are required' },
        { status: 400 }
      )
    }
    
    // Get the database user ID from Clerk ID
    const prisma = (await import('@/lib/server/prisma')).default
    const dbUser = await prisma.user.findFirst({
      where: { clerkId: clerkUser.id }
    })
    
    if (!dbUser) {
      logger.error('Database user not found for Clerk ID', { clerkId: clerkUser.id })
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }
    
    // Use the new InvitationService
    const invitationService = InvitationService.getInstance()
    
    const result = await invitationService.createInvitation({
      emailAddress,
      role: role as 'SUPER_ADMIN' | 'COWORK_ADMIN' | 'COWORK_USER' | 'CLIENT_ADMIN' | 'END_USER',
      tenantId,
      invitedBy: dbUser.id,  // Use database user ID instead of Clerk ID
      redirectUrl
    })
    
    return NextResponse.json({
      success: true,
      invitation: result.invitation
    })

  } catch (error: any) {
    logger.error('Unified invitations POST API error', error, { emailAddress, role, tenantId })
    
    // Handle specific error messages from InvitationService
    const errorMessage = error.message || 'Failed to create invitation'
    const statusCode = error.message?.includes('Ya existe') ? 409 : 
                      error.message?.includes('inválida') ? 400 : 500
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}