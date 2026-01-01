import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import AuditLog from '@/models/AuditLog';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const booking = await Booking.findById(bookingId).populate('propertyId');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify user is the owner of this property
    const property = booking.propertyId as any;
    if (property.ownerId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only accept bookings for your properties' },
        { status: 403 }
      );
    }

    // Can only accept pending bookings
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot accept ${booking.status} booking` },
        { status: 400 }
      );
    }

    const oldStatus = booking.status;
    booking.status = 'confirmed';
    booking.acceptedAt = new Date();
    booking.acceptedBy = new mongoose.Types.ObjectId(session.user.id);

    await booking.save();

    // Create audit log
    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'BOOKING_ACCEPTED',
      entityType: 'Booking',
      entityId: bookingId,
      status: 'success',
      changes: {
        before: { status: oldStatus },
        after: { status: 'confirmed' },
      },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Booking accepted. Student can now proceed with payment.',
      booking: {
        _id: booking._id.toString(),
        status: booking.status,
      },
    });
  } catch (error: any) {
    console.error('Error accepting booking:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to accept booking' },
      { status: 500 }
    );
  }
}
