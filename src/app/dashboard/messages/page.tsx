import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Booking from '@/models/Booking';
import UserLayoutContent from '@/components/user/layout/UserLayoutContent';
import MessagesContent from '@/components/user/messages/MessagesContent';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

async function getConversations(userId: string) {
  try {
    await dbConnect();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all distinct threads for this user (both booking-based and direct property threads)
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { studentId: userObjectId },
            { ownerId: userObjectId },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$threadId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$read', false] }, { $ne: ['$senderRole', 'student'] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Fetch property and owner information for each thread
    const conversationsWithDetails = await Promise.all(
      messages.map(async (conv: any) => {
        const threadId = conv._id;
        const [propertyId, ownerId] = threadId.split('-');

        try {
          // Fetch property details
          const Property = (await import('@/models/Property')).default;
          const User = (await import('@/models/User')).default;
          
          const property = await Property.findById(propertyId).lean();
          const owner = await User.findById(ownerId).select('name email isOnline lastSeen').lean();
          
          // Fetch student details
          const student = await User.findById(conv.lastMessage.studentId).select('name email').lean();

          // Determine who the "other person" is based on current user
          // If current user is the student, show owner name
          // If current user is the owner, show student name  
          const lastMsg = conv.lastMessage;
          let otherPersonName = 'Unknown';
          let otherPersonId = null;
          
          if (String(lastMsg.studentId) === userId) {
            // Current user is the student, show owner
            otherPersonName = owner?.name || 'Property Owner';
            otherPersonId = ownerId;
          } else {
            // Current user is the owner, show student
            otherPersonName = student?.name || 'Student';
            otherPersonId = String(lastMsg.studentId);
          }

          return {
            threadId,
            lastMessage: {
              _id: String(lastMsg._id),
              message: lastMsg.message,
              senderRole: lastMsg.senderRole,
              createdAt: lastMsg.createdAt?.toISOString() || new Date().toISOString(),
              read: lastMsg.read || false,
            },
            unreadCount: conv.unreadCount,
            property: property ? {
              _id: String(property._id),
              title: property.title,
            } : null,
            owner: {
              _id: otherPersonId,
              name: otherPersonName,
            },
          };
        } catch (err) {
          console.error('Error fetching details for thread:', threadId, err);
          return {
            threadId,
            lastMessage: null,
            unreadCount: conv.unreadCount,
            property: null,
            owner: null,
          };
        }
      })
    );

    // Serialize to plain objects
    return JSON.parse(JSON.stringify(conversationsWithDetails));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

export default async function MessagesPage() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      redirect('/auth/signin');
    }

    const conversations = await getConversations(session.user.id);

    return (
      <UserLayoutContent
        title="Messages"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Messages' },
        ]}
      >
        <MessagesContent initialConversations={conversations} userId={session.user.id} />
      </UserLayoutContent>
    );
  } catch (error) {
    console.error('Error loading messages:', error);
    return (
      <UserLayoutContent title="Messages">
        <div className="relative rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-md p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-2 text-red-400">Error Loading Messages</h3>
            <p className="text-zinc-300">Please try refreshing the page or contact support.</p>
          </div>
        </div>
      </UserLayoutContent>
    );
  }
}
