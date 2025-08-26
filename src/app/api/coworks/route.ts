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

    // Get user role from Clerk metadata (check private first, then public)
    const privateMetadata = clerkUser.privateMetadata as any;
    const publicMetadata = clerkUser.publicMetadata as any;
    const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
    
    // Create effective user object from Clerk data
    const effectiveUser = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      role: userRole,
      tenantId: privateMetadata?.tenantId || publicMetadata?.tenantId || null
    };

    // For SUPER_ADMIN with no tenantId, get all coworks
    if (effectiveUser.role === 'SUPER_ADMIN' && effectiveUser.tenantId === null) {
      const allCoworks = await prisma.tenant.findMany({
        where: {
          status: {
            in: ['ACTIVE', 'SUSPENDED']  // Don't show INACTIVE (deleted) coworks
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          status: true,
          createdAt: true,
          updatedAt: true,
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
        logo: tenant.logo,
        status: tenant.status,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
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
          logo: true,
          status: true
        }
      })
      
      if (tenant && tenant.status === 'ACTIVE') {
        const cowork = {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logo: tenant.logo,
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