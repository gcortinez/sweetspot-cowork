import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'

/**
 * User Coworks API
 * Returns coworks accessible by the current user
 * Updated to use Clerk authentication
 */

export async function GET(request: NextRequest) {
  try {
    // Get the current user from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the user record in our database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: clerkUser.id },
          { email: clerkUser.emailAddresses[0]?.emailAddress }
        ],
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
      }
    })

    // TEMPORARY: Force Gustavo as SUPER_ADMIN for testing
    const isGustavo = clerkUser.firstName === 'Gustavo' || 
                      clerkUser.emailAddresses[0]?.emailAddress?.includes('gustavo');
    
    if (!user && !isGustavo) {
      return NextResponse.json(
        { success: false, error: 'User record not found' },
        { status: 404 }
      )
    }
    
    // Override for Gustavo
    const effectiveUser = isGustavo && !user ? {
      id: 'temp-super-admin',
      email: clerkUser.emailAddresses[0]?.emailAddress,
      role: 'SUPER_ADMIN' as const,
      tenantId: null
    } : user;
    
    if (!effectiveUser) {
      return NextResponse.json(
        { success: false, error: 'User record not found' },
        { status: 404 }
      )
    }

    // For SUPER_ADMIN with no tenantId, get all coworks
    if (effectiveUser.role === 'SUPER_ADMIN' && effectiveUser.tenantId === null) {
      const allCoworks = await prisma.tenant.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          _count: {
            select: {
              users: true,
              clients: true,
              spaces: true,
              bookings: true,
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      const formattedCoworks = allCoworks.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        role: 'SUPER_ADMIN',
        stats: {
          users: tenant._count.users,
          clients: tenant._count.clients,
          spaces: tenant._count.spaces,
          bookings: tenant._count.bookings,
        }
      }))

      return NextResponse.json({
        success: true,
        data: {
          userCoworks: [], // Super admin's personal coworks (empty)
          defaultCowork: null,
          allCoworks: formattedCoworks, // All platform coworks for management
          isSuperAdmin: true
        }
      })
    }

    // For regular users, get their tenant/cowork info
    let userCoworks = []
    let defaultCowork = null
    
    if (effectiveUser.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: effectiveUser.tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      })
      
      if (tenant && tenant.status === 'ACTIVE') {
        const cowork = {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          role: effectiveUser.role,
          status: tenant.status
        }
        
        userCoworks = [cowork]
        defaultCowork = cowork
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userCoworks,
        defaultCowork,
        isSuperAdmin: effectiveUser.role === 'SUPER_ADMIN'
      }
    })

  } catch (error) {
    console.error('Coworks API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user coworks' },
      { status: 500 }
    )
  }
}