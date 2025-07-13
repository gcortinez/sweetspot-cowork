import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, metadata } = await request.json();

    if (!userId || !metadata) {
      return NextResponse.json(
        { error: 'Missing userId or metadata' },
        { status: 400 }
      );
    }

    // Create Clerk client instance
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Update user metadata using Clerk's server API
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update metadata' },
      { status: 500 }
    );
  }
}