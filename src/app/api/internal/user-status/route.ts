import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/server/prisma'

/**
 * Internal API to check user status
 * Used by middleware to check if user is suspended
 */
export async function POST(request: NextRequest) {
  try {
    const { clerkId, email } = await request.json()
    
    if (!clerkId && !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing clerkId or email' 
      }, { status: 400 })
    }

    // Find user in database by Clerk ID or email, include tenant info
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(clerkId ? [{ clerkId }] : []),
          ...(email ? [{ email }] : [])
        ]
      },
      select: {
        id: true,
        status: true,
        email: true,
        clerkId: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    // Determine effective user status based on user and tenant status
    let effectiveStatus = user?.status || null;
    let suspensionReason = null;
    
    if (user) {
      // If user is already suspended, keep that status
      if (user.status === 'SUSPENDED') {
        suspensionReason = 'User account suspended';
      }
      // If user's tenant is suspended, treat user as suspended
      else if (user.tenant?.status === 'SUSPENDED') {
        effectiveStatus = 'SUSPENDED';
        suspensionReason = `Cowork "${user.tenant.name}" is suspended`;
      }
      // If user's tenant is inactive (deleted), treat as suspended
      else if (user.tenant?.status === 'INACTIVE') {
        effectiveStatus = 'SUSPENDED';
        suspensionReason = `Cowork "${user.tenant.name}" is no longer active`;
      }
    }

    return NextResponse.json({
      success: true,
      user: user ? {
        ...user,
        status: effectiveStatus,
        suspensionReason,
        tenantStatus: user.tenant?.status || null
      } : null
    })

  } catch (error) {
    console.error('Error checking user status:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}