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

    const { threadId, bookingId, message, ownerId, propertyId } = await req.json();

    if (!message || !threadId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id role').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine sender role and set appropriate IDs
    const isOwner = user.role === 'owner' || user.role === 'admin';
    const senderRole = isOwner ? 'owner' : 'student';
    
    // Parse threadId to get propertyId and ownerId if not provided
    const [parsedPropertyId, parsedOwnerId] = threadId.split('-');
    
    // If owner is sending, find the student from existing messages in this thread
    let finalStudentId = isOwner ? null : user._id;
    let finalOwnerId = isOwner ? user._id : (ownerId || parsedOwnerId);
    
    if (isOwner) {
      // Find existing message in this thread to get the student ID
      const existingMessage = await Message.findOne({ threadId }).select('studentId').lean() as any;
      if (existingMessage && existingMessage.studentId) {
        finalStudentId = existingMessage.studentId;
      } else {
        // This shouldn't happen, but if it does, log an error
        console.error('Owner trying to send message in thread with no existing messages:', threadId);
        return NextResponse.json(
          { error: 'Cannot send message: no existing conversation found' },
          { status: 400 }
        );
      }
    }
    
    const newMessage = await Message.create({
      threadId,
      bookingId: bookingId || undefined,
      studentId: finalStudentId,
      ownerId: finalOwnerId,
      senderRole,
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');

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

    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .populate('studentId', 'name')
      .populate('ownerId', 'name')
      .lean();

    // Mark messages as delivered when the recipient fetches them
    const isOwner = user.role === 'owner' || user.role === 'admin';
    const deliveryUpdateQuery = isOwner
      ? { threadId, senderRole: 'student', delivered: false }
      : { threadId, senderRole: 'owner', delivered: false };

    await Message.updateMany(deliveryUpdateQuery, {
      $set: { delivered: true, deliveredAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
