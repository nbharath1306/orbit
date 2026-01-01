import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await req.json();

    if (!threadId) {
      return NextResponse.json(
        { error: 'threadId is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id role').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark all messages in this thread as read where the current user is the recipient
    // If user is owner, mark student messages as read
    // If user is student, mark owner messages as read
    const isOwner = user.role === 'owner' || user.role === 'admin';
    
    const updateQuery = isOwner
      ? { threadId, senderRole: 'student', read: false }
      : { threadId, senderRole: 'owner', read: false };

    await Message.updateMany(updateQuery, {
      $set: { read: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
