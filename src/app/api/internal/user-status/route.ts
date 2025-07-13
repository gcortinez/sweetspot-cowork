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

    // Find user in database by Clerk ID or email
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
        clerkId: true
      }
    })

    return NextResponse.json({
      success: true,
      user: user || null
    })

  } catch (error) {
    console.error('Error checking user status:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}