import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

// Update user's online status
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isOnline } = await req.json();

    await dbConnect();

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        isOnline,
        lastSeen: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  } catch (error: any) {
    console.error('Error updating online status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update online status' },
      { status: 500 }
    );
  }
}

// Get online status for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId).select('isOnline lastSeen').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  } catch (error: any) {
    console.error('Error fetching online status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch online status' },
      { status: 500 }
    );
  }
}
