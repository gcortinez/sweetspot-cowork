import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for updating activities
const updateActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'TOUR', 'FOLLOW_UP', 'DOCUMENT']).optional(),
  subject: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  duration: z.number().optional(),
  location: z.string().optional(),
  outcome: z.string().optional(),
  completedAt: z.string().nullish(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database to get tenantId
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, tenantId: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    console.log('Fetching activity:', id);

    const whereClause: any = {
      id,
      userId: dbUser.id, // Ensure user can only access their own activities
    };

    // Add tenantId filter if user has a tenant
    if (dbUser.tenantId) {
      whereClause.tenantId = dbUser.tenantId;
    }

    const activity = await db.activity.findUnique({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateActivitySchema.parse(body);

    console.log('Updating activity:', id, validatedData);

    // Get user from database to get tenantId
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, tenantId: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const whereClause: any = {
      id,
      userId: dbUser.id,
    };

    // Add tenantId filter if user has a tenant
    if (dbUser.tenantId) {
      whereClause.tenantId = dbUser.tenantId;
    }

    // Check if activity exists and belongs to user
    const existingActivity = await db.activity.findUnique({
      where: whereClause,
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Update activity in database
    const activity = await db.activity.update({
      where: { id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        completedAt: validatedData.completedAt === null ? null : 
                    validatedData.completedAt ? new Date(validatedData.completedAt) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
      },
    });

    console.log('Activity updated:', activity.id);

    return NextResponse.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('Deleting activity:', id);

    // Get user from database to get tenantId
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, tenantId: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const whereClause: any = {
      id,
      userId: dbUser.id,
    };

    // Add tenantId filter if user has a tenant
    if (dbUser.tenantId) {
      whereClause.tenantId = dbUser.tenantId;
    }

    // Check if activity exists and belongs to user
    const existingActivity = await db.activity.findUnique({
      where: whereClause,
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Delete activity from database
    await db.activity.delete({
      where: { id },
    });

    console.log('Activity deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}