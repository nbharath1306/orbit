import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { rateLimit, getClientIp, createErrorResponse, addSecurityHeaders } from '@/lib/security';
import crypto from 'crypto';

// Create Razorpay order
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`payment-${clientIp}`, 30, 60000);

    if (!rateLimitResult.success) {
      return addSecurityHeaders(createErrorResponse('Too many requests', 429));
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id').lean();
    if (!user) {
      return addSecurityHeaders(createErrorResponse('User not found', 404));
    }

    const body = await req.json();
    const { bookingId } = body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return addSecurityHeaders(createErrorResponse('Booking not found', 404));
    }

    // Verify ownership
    if (booking.studentId.toString() !== user._id.toString()) {
      return addSecurityHeaders(createErrorResponse('Access denied', 403));
    }

    // Check if already paid
    if (booking.paymentStatus === 'paid') {
      return addSecurityHeaders(createErrorResponse('Booking already paid', 400));
    }

    // Mock Razorpay integration (replace with actual Razorpay API)
    const razorpayOrderId = `order_${crypto.randomBytes(16).toString('hex')}`;
    
    // In production, create actual Razorpay order:
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({
    //   key_id: process.env.RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET,
    // });
    // 
    // const order = await razorpay.orders.create({
    //   amount: booking.totalAmount * 100, // amount in paise
    //   currency: 'INR',
    //   receipt: `receipt_${booking._id}`,
    //   notes: {
    //     bookingId: booking._id.toString(),
    //     studentId: user._id.toString(),
    //   },
    // });

    // Update booking with order details
    booking.razorpayOrderId = razorpayOrderId;
    await booking.save();

    return addSecurityHeaders(
      NextResponse.json({
        orderId: razorpayOrderId,
        amount: booking.totalAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
        booking: {
          id: booking._id,
          propertyTitle: booking.propertyId,
          checkInDate: booking.checkInDate,
        },
      })
    );
  } catch (error) {
    console.error('Error creating payment order:', error);
    return addSecurityHeaders(createErrorResponse('Failed to create payment order', 500));
  }
}

// Verify payment callback
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    await dbConnect();

    const body = await req.json();
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return addSecurityHeaders(createErrorResponse('Booking not found', 404));
    }

    // Verify Razorpay signature (in production)
    // const generatedSignature = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    //   .digest('hex');
    // 
    // if (generatedSignature !== razorpaySignature) {
    //   return addSecurityHeaders(createErrorResponse('Invalid payment signature', 400));
    // }

    // Update booking payment status
    booking.paymentStatus = 'paid';
    booking.paymentId = razorpayPaymentId;
    booking.razorpaySignature = razorpaySignature;
    booking.amountPaid = booking.totalAmount;
    
    // Auto-confirm booking after successful payment
    if (booking.status === 'pending') {
      booking.status = 'confirmed';
    }

    await booking.save();

    return addSecurityHeaders(
      NextResponse.json({
        message: 'Payment verified successfully',
        booking,
      })
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return addSecurityHeaders(createErrorResponse('Failed to verify payment', 500));
  }
}
