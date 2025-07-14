import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating activities
const createActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'TOUR', 'FOLLOW_UP', 'DOCUMENT']),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  opportunityId: z.string().optional(),
  dueDate: z.string().optional(),
  duration: z.number().optional(),
  location: z.string().optional(),
  outcome: z.string().optional(),
  completedAt: z.string().optional(),
});

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const clientId = searchParams.get('clientId');
    const opportunityId = searchParams.get('opportunityId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('Fetching activities with params:', {
      leadId,
      clientId,
      opportunityId,
      sortBy,
      sortOrder,
      page,
      limit,
      userId: dbUser.id,
      tenantId: dbUser.tenantId
    });

    // Build where clause
    const whereClause: any = {
      userId: dbUser.id,
    };

    // Add tenantId filter if user has a tenant
    if (dbUser.tenantId) {
      whereClause.tenantId = dbUser.tenantId;
    }

    if (leadId) whereClause.leadId = leadId;
    if (clientId) whereClause.clientId = clientId;
    if (opportunityId) whereClause.opportunityId = opportunityId;

    // Fetch activities from database
    const activities = await db.activity.findMany({
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
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    console.log(`Found ${activities.length} activities`);

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total: activities.length,
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);

    console.log('Creating activity:', validatedData);

    // Create activity in database
    const activity = await db.activity.create({
      data: {
        ...validatedData,
        userId: dbUser.id,
        tenantId: dbUser.tenantId!,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : null,
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

    console.log('Activity created:', activity.id);

    return NextResponse.json({
      success: true,
      data: activity,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}