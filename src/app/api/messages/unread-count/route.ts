import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Count unread messages where the user is the recipient
    const unreadCount = await Message.countDocuments({
      $or: [
        // User received messages from owner
        { studentId: userObjectId, senderRole: 'owner', read: false },
        // Owner received messages from user
        { ownerId: userObjectId, senderRole: 'student', read: false }
      ]
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
