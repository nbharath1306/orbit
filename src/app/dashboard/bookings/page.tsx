import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Booking from '@/models/Booking';
import UserLayoutContent from '@/components/user/layout/UserLayoutContent';
import BookingList, { BookingItem } from '@/components/user/bookings/BookingList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getUserBookings(userId: string) {
  try {
    await dbConnect();

    const bookings = await Booking.find({ studentId: userId })
      .populate('propertyId', 'title slug location images')
      .populate('ownerId', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    return bookings.map((booking: any) => ({
      ...booking,
      _id: booking._id.toString(),
    })) as BookingItem[];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

export default async function BookingsPage() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      redirect('/auth/signin');
      return null;
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user) {
      redirect('/auth/signin');
      return null;
    }

    const bookings = await getUserBookings(user._id.toString());

    const activeCount = bookings.filter((b) =>
      ['pending', 'confirmed', 'paid'].includes(b.status)
    ).length;

    return (
      <UserLayoutContent
        title="My Bookings"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Bookings' },
        ]}
        actions={
          <Link href="/search">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">+ New Booking</Button>
          </Link>
        }
      >
        {/* Filter Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-6 border-b border-white/10 overflow-x-auto">
          <Link 
            href="/dashboard/bookings" 
            className="px-3 sm:px-4 py-2 border-b-2 border-blue-500 text-blue-400 font-semibold text-sm whitespace-nowrap"
          >
            All ({bookings.length})
          </Link>
          <button className="px-3 sm:px-4 py-2 text-zinc-400 font-semibold text-sm whitespace-nowrap hover:text-blue-400 transition-colors">
            Active ({activeCount})
          </button>
          <button className="px-3 sm:px-4 py-2 text-zinc-400 font-semibold text-sm whitespace-nowrap hover:text-blue-400 transition-colors">
            Completed ({bookings.filter((b) => b.status === 'confirmed').length})
          </button>
        </div>

        {/* Bookings List */}
        {bookings.length > 0 ? (
          <BookingList bookings={bookings} filter="all" />
        ) : (
          <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-zinc-400 text-lg mb-4">No bookings yet</p>
              <Link href="/search">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                  Browse Properties
                </Button>
              </Link>
            </div>
          </div>
        )}
      </UserLayoutContent>
    );
  } catch (error) {
    console.error('Error loading bookings:', error);
    return (
      <UserLayoutContent title="My Bookings">
        <div className="relative rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-md p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-2 text-red-400">Error Loading Bookings</h3>
            <p className="text-zinc-300">Please try refreshing the page or contact support if the issue persists.</p>
          </div>
        </div>
      </UserLayoutContent>
    );
  }
}
