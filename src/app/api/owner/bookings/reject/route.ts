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

    const { bookingId, reason } = await req.json();

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
        { error: 'You can only reject bookings for your properties' },
        { status: 403 }
      );
    }

    // Can only reject pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot reject ${booking.status} booking` },
        { status: 400 }
      );
    }

    const oldStatus = booking.status;
    booking.status = 'rejected';
    booking.rejectedAt = new Date();
    booking.rejectedBy = new mongoose.Types.ObjectId(session.user.id);
    booking.rejectionReason = reason || 'Owner declined';

    await booking.save();

    // Create audit log
    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'BOOKING_REJECTED',
      entityType: 'Booking',
      entityId: bookingId,
      status: 'success',
      changes: {
        before: { status: oldStatus },
        after: { status: 'rejected', reason: reason || 'Owner declined' },
      },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Booking rejected',
      booking: {
        _id: booking._id.toString(),
        status: booking.status,
      },
    });
  } catch (error: any) {
    console.error('Error rejecting booking:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to reject booking' },
      { status: 500 }
    );
  }
}
