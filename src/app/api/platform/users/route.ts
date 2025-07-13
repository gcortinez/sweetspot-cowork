import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'

/**
 * Platform Users Management API
 * Returns all users across the platform for Super Admins
 */

export async function GET(request: NextRequest) {
  try {
    console.log('👥 Platform Users API called');
    
    // Get the current user from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      console.log('👥 No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is Super Admin
    const privateMetadata = clerkUser.privateMetadata as any;
    const publicMetadata = clerkUser.publicMetadata as any;
    const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
    
    console.log('👥 User role:', userRole);
    
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch all users with their tenant information
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`👥 Found ${users.length} users`);

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      status: user.status,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug
      } : null,
      tenantName: user.tenant?.name || 'Plataforma',
      lastLogin: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }));

    // Calculate summary statistics
    const stats = {
      total: users.length,
      byRole: {
        super_admin: users.filter(u => u.role === 'SUPER_ADMIN').length,
        cowork_admin: users.filter(u => u.role === 'COWORK_ADMIN').length,
        cowork_user: users.filter(u => u.role === 'COWORK_USER').length,
        client_admin: users.filter(u => u.role === 'CLIENT_ADMIN').length,
        end_user: users.filter(u => u.role === 'END_USER').length
      },
      byStatus: {
        active: users.filter(u => u.status === 'ACTIVE').length,
        inactive: users.filter(u => u.status === 'INACTIVE').length,
        suspended: users.filter(u => u.status === 'SUSPENDED').length
      },
      byTenant: users.reduce((acc, user) => {
        const tenantName = user.tenant?.name || 'Plataforma';
        acc[tenantName] = (acc[tenantName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      stats
    });

  } catch (error) {
    console.error('Platform users API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform users' },
      { status: 500 }
    );
  }
}