import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'

/**
 * Platform Coworks API
 * Returns all coworks available for Super Admins
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 Platform Coworks API called');
    
    // Get the current user from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      console.log('🏢 No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is Super Admin
    const privateMetadata = clerkUser.privateMetadata as any;
    const publicMetadata = clerkUser.publicMetadata as any;
    const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
    
    console.log('🏢 User role:', userRole);
    
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch all coworks
    const coworks = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`🏢 Found ${coworks.length} coworks`);

    // Format coworks for frontend
    const formattedCoworks = coworks.map(cowork => ({
      id: cowork.id,
      name: cowork.name,
      slug: cowork.slug,
      status: cowork.status,
      userCount: cowork._count.users,
      createdAt: cowork.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      coworks: formattedCoworks
    });

  } catch (error) {
    console.error('Platform coworks API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform coworks' },
      { status: 500 }
    );
  }
}