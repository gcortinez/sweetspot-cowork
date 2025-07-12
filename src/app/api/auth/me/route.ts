import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/server/prisma';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user from Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
    
    if (error || !supabaseUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the user record in our database
    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseUser.id },
          { email: supabaseUser.email }
        ],
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        tenantId: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        supabaseId: true,
      }
    });

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: 'User record not found' },
        { status: 404 }
      );
    }

    // Update supabaseId if it's missing
    if (!userRecord.supabaseId && supabaseUser.id) {
      await prisma.user.update({
        where: { id: userRecord.id },
        data: { supabaseId: supabaseUser.id }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
        status: userRecord.status,
        tenantId: userRecord.tenantId,
        clientId: userRecord.clientId,
        createdAt: userRecord.createdAt,
        updatedAt: userRecord.updatedAt,
      }
    });

  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}