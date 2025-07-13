import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/server/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * Update User API
 * Updates a specific user's information
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    console.log('👤 Update User API called for ID:', id);
    
    // Get the current user from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      console.log('👤 No authenticated user');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is Super Admin
    const privateMetadata = clerkUser.privateMetadata as any;
    const publicMetadata = clerkUser.publicMetadata as any;
    const userRole = privateMetadata?.role || publicMetadata?.role || 'END_USER';
    
    console.log('👤 User role:', userRole);
    
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { firstName, lastName, email, phone, role, status } = body

    console.log('👤 Update data:', { firstName, lastName, email, phone, role, status });

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Validate role if provided
    const validRoles = ['SUPER_ADMIN', 'COWORK_ADMIN', 'COWORK_USER', 'CLIENT_ADMIN', 'END_USER']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status specified' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        ...(role && { role }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    console.log('👤 User updated successfully:', updatedUser.id);

    // Format response
    const formattedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      phone: updatedUser.phone,
      role: updatedUser.role,
      status: updatedUser.status,
      tenant: updatedUser.tenant ? {
        id: updatedUser.tenant.id,
        name: updatedUser.tenant.name,
        slug: updatedUser.tenant.slug
      } : null,
      tenantName: updatedUser.tenant?.name || 'Plataforma',
      lastLogin: updatedUser.lastLoginAt?.toISOString() || null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      user: formattedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}