import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { NextRequest, NextResponse } from 'next/server';

// Note: Razorpay integration is handled through frontend SDK
// This endpoint creates an order ID for tracking purposes

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, amount } = await req.json();

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Can only pay for confirmed bookings
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: `Cannot pay for ${booking.status} booking` },
        { status: 400 }
      );
    }

    // Generate a simple order ID for tracking
    const orderId = `booking_${bookingId}_${Date.now()}`;

    // Save order ID to booking
    booking.razorpayOrderId = orderId;
    await booking.save();

    return NextResponse.json({
      orderId,
      key: process.env.RAZORPAY_KEY_ID || 'test_key',
      bookingId,
      amount,
    });
  } catch (error: any) {
    console.error('Error creating payment order:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
