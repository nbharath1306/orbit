import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Treat as conversationId (new format)
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Try to get as conversation first
    const conversation = await Conversation.findById(bookingId);
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is part of conversation
    if (
      conversation.studentId.toString() !== session.user.id &&
      conversation.ownerId.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const messages = await Message.find({
      conversationId: bookingId,
    })
      .sort({ createdAt: 1 })
      .populate('studentId', 'name')
      .populate('ownerId', 'name')
      .lean();

    return NextResponse.json({
      success: true,
      messages,
      endChatRequested: conversation.endChatRequested,
      endChatApprovals: conversation.endChatApprovals,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
