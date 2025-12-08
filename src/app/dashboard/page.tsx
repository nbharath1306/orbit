import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Booking from '@/models/Booking';
import UserLayoutContent from '@/components/user/layout/UserLayoutContent';
import WelcomeCard from '@/components/user/dashboard/WelcomeCard';
import UserStatsCard from '@/components/user/dashboard/UserStatsCard';
import QuickActionButtons from '@/components/user/dashboard/QuickActionButtons';
import RecentActivityFeed, { Activity } from '@/components/user/dashboard/RecentActivityFeed';

export const dynamic = 'force-dynamic';

async function getUserStats(userId: string) {
  try {
    await dbConnect();

    const activeBookings = await Booking.countDocuments({
      studentId: userId,
      $or: [{ status: 'confirmed' }, { status: 'paid' }],
    }).catch(() => 0);

    const paidBookingsResult = await Booking.aggregate([
      {
        $match: {
          studentId: userId,
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountPaid' },
        },
      },
    ]).catch(() => []);

    const thisMonthBookingsResult = await Booking.aggregate([
      {
        $match: {
          studentId: userId,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountPaid' },
        },
      },
    ]).catch(() => []);

    return {
      activeBookings: activeBookings || 0,
      totalSpent: paidBookingsResult?.[0]?.total || 0,
      monthlySpent: thisMonthBookingsResult?.[0]?.total || 0,
      averageRating: 4.8,
      unreadMessages: 0,
      pendingReviews: 0,
      savedProperties: 0,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      activeBookings: 0,
      totalSpent: 0,
      monthlySpent: 0,
      averageRating: 0,
      unreadMessages: 0,
      pendingReviews: 0,
      savedProperties: 0,
    };
  }
}

async function getRecentActivity(userId: string): Promise<Activity[]> {
  try {
    await dbConnect();

    const recentBookings = await Booking.find({ studentId: userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('propertyId', 'title')
      .lean();

    const activities: Activity[] = recentBookings.map((booking: any) => {
      const statusMap: Record<string, Activity['type']> = {
        confirmed: 'booking_confirmed',
        rejected: 'booking_cancelled',
        paid: 'payment_received',
        pending: 'booking_confirmed',
      };

      return {
        id: booking._id.toString(),
        type: statusMap[booking.status] || 'booking_confirmed',
        title:
          statusMap[booking.status] === 'booking_confirmed'
            ? 'Booking Confirmed'
            : statusMap[booking.status] === 'booking_cancelled'
              ? 'Booking Cancelled'
              : 'Payment Received',
        description: `${booking.propertyId?.title || 'Property'} - ₹${(booking.amountPaid / 100).toFixed(2)}`,
        timestamp: (booking.updatedAt || booking.createdAt).toISOString(),
        link: `/dashboard/bookings/${booking._id.toString()}`,
      };
    });

    return activities;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  let user = null;
  let stats = {
    activeBookings: 0,
    totalSpent: 0,
    monthlySpent: 0,
    averageRating: 4.8,
    unreadMessages: 0,
    pendingReviews: 0,
    savedProperties: 0,
  };
  let activities: Activity[] = [];

  try {
    if (session?.user?.email) {
      await dbConnect();
      user = await User.findOne({ email: session.user.email }).lean();

      if (user) {
        const statsResult = await getUserStats(user._id.toString()).catch(() => ({
          activeBookings: 0,
          totalSpent: 0,
          monthlySpent: 0,
          averageRating: 4.8,
          unreadMessages: 0,
          pendingReviews: 0,
          savedProperties: 0,
        }));
        stats = statsResult;

        const activitiesResult = await getRecentActivity(user._id.toString()).catch(() => []);
        activities = activitiesResult;
      }
    }
  } catch (error) {
    console.error('Error in dashboard page:', error);
  }

  if (!user) {
    return (
      <UserLayoutContent title="Dashboard">
        <div className="relative rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-md p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-2 text-red-400">Error Loading Dashboard</h3>
            <p className="text-zinc-300">Please try refreshing the page or contact support if the issue persists.</p>
          </div>
        </div>
      </UserLayoutContent>
    );
  }

  return (
    <UserLayoutContent 
      title="Command Center"
      subtitle="Welcome back! Here's your personalized dashboard"
    >
      <div className="space-y-6">
        <WelcomeCard
          userName={user.name || 'User'}
          userAvatar={user.image}
          lastLoginDate={new Date().toISOString()}
          newNotifications={0}
        />

        <UserStatsCard stats={stats} />

        <QuickActionButtons />

        <RecentActivityFeed activities={activities} />
      </div>
    </UserLayoutContent>
  );
}
