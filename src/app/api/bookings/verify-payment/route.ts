import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import AuditLog from '@/models/AuditLog';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, paymentId, orderId, signature } = await req.json();

    if (!bookingId || !paymentId || !orderId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
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

    // Verify this is the student's booking
    if (booking.studentId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'This is not your booking' },
        { status: 403 }
      );
    }

    // Verify signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
      .update(body)
      .digest('hex');

    // For development/testing, allow signature bypass with test payments
    const isTestMode = process.env.NODE_ENV === 'development';
    const signatureValid = isTestMode || expectedSignature === signature;

    if (!signatureValid) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Update booking status
    const oldStatus = booking.status;
    booking.status = 'paid';
    booking.paymentId = paymentId;
    booking.razorpayOrderId = orderId;
    booking.amountPaid = booking.totalAmount || 0;
    booking.paidAt = new Date();
    booking.paymentStatus = 'paid';

    await booking.save();

    // Create audit log
    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'BOOKING_PAYMENT_COMPLETED',
      entityType: 'Booking',
      entityId: bookingId,
      status: 'success',
      changes: {
        before: { status: oldStatus, amountPaid: 0 },
        after: { status: 'paid', amountPaid: booking.totalAmount },
        paymentId,
      },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      booking: {
        _id: booking._id.toString(),
        status: booking.status,
      },
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
