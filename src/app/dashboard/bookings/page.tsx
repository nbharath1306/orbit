import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import UserLayoutContent from '@/components/user/layout/UserLayoutContent';
import BookingsPageContent from '@/components/user/bookings/BookingsPageContent';
import { BookingItem } from '@/components/user/bookings/BookingList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getUserBookings(userId: string) {
  try {
    await dbConnect();
    
    // Ensure models are registered
    Property; // Force model registration
    Booking; // Force model registration

    const bookings = await Booking.find({ studentId: new mongoose.Types.ObjectId(userId) })
      .populate('propertyId', 'title slug location')
      .populate('ownerId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Convert MongoDB objects to plain objects
    return bookings.map((booking: any) => ({
      _id: booking._id?.toString() || '',
      studentId: booking.studentId?.toString ? booking.studentId.toString() : booking.studentId,
      propertyId: {
        _id: booking.propertyId?._id?.toString() || '',
        title: booking.propertyId?.title || 'Unknown Property',
        slug: booking.propertyId?.slug || '',
        location: {
          address: booking.propertyId?.location?.address || '',
        },
      },
      ownerId: {
        _id: booking.ownerId?._id?.toString() || '',
        name: booking.ownerId?.name || 'Unknown Owner',
      },
      status: booking.status || 'pending',
      paymentStatus: booking.paymentStatus || 'pending',
      checkInDate: booking.checkInDate?.toISOString() || new Date().toISOString(),
      durationMonths: booking.durationMonths || 1,
      monthlyRent: booking.monthlyRent || 0,
      totalAmount: booking.totalAmount || 0,
      amountPaid: booking.amountPaid || 0,
      createdAt: booking.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: booking.updatedAt?.toISOString() || new Date().toISOString(),
      ownerResponse: booking.ownerResponse || null,
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
        <BookingsPageContent initialBookings={bookings} />
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
