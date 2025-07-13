import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/server/prisma";
import { UserRole } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    console.log('📍 API /auth/clerk/sync called');
    
    // Verify Clerk authentication
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ No Clerk user ID found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clerkId, email, firstName, lastName, metadata } = body;

    console.log('🔍 Syncing user:', { clerkId, email, firstName, lastName });

    // Verify the clerkId matches the authenticated user
    if (clerkId !== userId) {
      console.log('❌ Clerk ID mismatch');
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if user already exists in our database
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: clerkId },
          { email: email }
        ]
      },
      include: {
        tenant: true,
        client: true,
      }
    });

    if (user) {
      // Update existing user
      console.log('✅ User exists, updating:', user.email);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          clerkId: clerkId,
          email: email,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          // Don't override role if it's already set
          role: user.role || (metadata?.role as UserRole) || 'END_USER',
          isOnboarded: metadata?.isOnboarded ?? user.isOnboarded,
          updatedAt: new Date(),
        },
        include: {
          tenant: true,
          client: true,
        }
      });
    } else {
      // Create new user
      console.log('🆕 Creating new user:', email);
      
      // Default role for new users
      const defaultRole: UserRole = metadata?.role || 'END_USER';
      
      user = await prisma.user.create({
        data: {
          clerkId: clerkId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: defaultRole,
          tenantId: metadata?.tenantId || null,
          clientId: metadata?.clientId || null,
          isOnboarded: metadata?.isOnboarded || false,
          isActive: true,
        },
        include: {
          tenant: true,
          client: true,
        }
      });

      console.log('✅ User created successfully:', user.id);
    }

    // Return user data
    const userData = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      clientId: user.clientId,
      isOnboarded: user.isOnboarded,
      isActive: user.isActive,
      tenant: user.tenant,
      client: user.client,
    };

    console.log('✅ User sync successful:', userData.email, 'Role:', userData.role);

    return NextResponse.json({
      success: true,
      user: userData,
    });

  } catch (error) {
    console.error('❌ Error in /auth/clerk/sync:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}