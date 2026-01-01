import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { NextRequest, NextResponse } from 'next/server';

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

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get user to get their ID
    const user = await User.findOne({ email: session.user.email }).select('_id').lean();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking
    if (booking.studentId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'You can only cancel your own bookings' },
        { status: 403 }
      );
    }

    // Check current status
    if (booking.status === 'rejected') {
      return NextResponse.json(
        { error: 'This booking has already been cancelled' },
        { status: 400 }
      );
    }

    if (booking.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Cannot cancel confirmed bookings. Please contact the owner to modify your booking.' },
        { status: 400 }
      );
    }

    if (booking.status === 'checked-in' || booking.status === 'completed') {
      return NextResponse.json(
        { error: `Cannot cancel ${booking.status} bookings` },
        { status: 400 }
      );
    }

    // Allow cancelling pending and paid bookings
    if (!['pending', 'paid'].includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot cancel bookings with status: ${booking.status}` },
        { status: 400 }
      );
    }

    const oldStatus = booking.status;
    booking.status = 'rejected';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'student';
    
    // If payment was made, process refund
    if (booking.paymentStatus === 'paid' && booking.amountPaid > 0) {
      booking.paymentStatus = 'refunded';
      booking.refundAmount = booking.amountPaid;
    }

    await booking.save();

    // Create audit log
    await AuditLog.create({
      userId: user._id.toString(),
      userEmail: session.user.email,
      action: 'BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: bookingId,
      status: 'success',
      changes: {
        before: { 
          status: oldStatus,
          paymentStatus: booking.paymentStatus,
        },
        after: { 
          status: 'rejected',
          paymentStatus: booking.paymentStatus,
        },
      },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: oldStatus === 'paid' 
        ? 'Booking cancelled and refund has been initiated. Please allow 5-7 business days for the refund to appear in your account.'
        : 'Booking cancelled successfully',
      booking: {
        _id: booking._id.toString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        refundAmount: booking.refundAmount,
      },
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);

    // Log error to audit log
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        await dbConnect();
        const user = await User.findOne({ email: session.user.email }).select('_id').lean();
        await AuditLog.create({
          userId: user?._id?.toString() || 'unknown',
          userEmail: session.user.email,
          action: 'BOOKING_CANCELLED',
          entityType: 'Booking',
          status: 'error',
          errorMessage: error.message,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date(),
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}

