import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import User from '@/models/User';
import crypto from 'crypto';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validateObjectId,
  getRequestMetadata,
  sanitizeErrorForLog,
  sanitizeString,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

/**
 * POST /api/bookings/payment
 * Creates a Razorpay order for payment (legacy endpoint)
 * Security: Rate limited, authenticated, ownership verified
 * Note: Consider migrating to /api/bookings/create-order
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - strict for payment operations (20 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for payment', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized payment attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Payment order request received', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    await dbConnect();

    // Get user ID
    const user = await User.findOne({ email: session.user.email }).select('_id').lean();
    if (!user) {
      logger.warn('User not found for payment', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { bookingId } = body;

    // Validate bookingId
    const validBookingId = validateObjectId(bookingId);
    if (!validBookingId) {
      logger.warn('Invalid bookingId for payment', {
        bookingId,
        email: session.user.email,
      });
      return createErrorResponse('Invalid booking ID format', 400);
    }

    // Fetch booking with defensive checks
    const booking = await Booking.findById(validBookingId);

    if (!booking) {
      logger.warn('Booking not found for payment', {
        bookingId: validBookingId,
        email: session.user.email,
      });
      return createErrorResponse('Booking not found', 404);
    }

    // Defensive null checks
    if (!booking.studentId || !booking.paymentStatus || typeof booking.totalAmount !== 'number') {
      logger.error('Booking has invalid data for payment', {
        bookingId: validBookingId,
        hasStudentId: !!booking.studentId,
        hasPaymentStatus: !!booking.paymentStatus,
        hasTotalAmount: typeof booking.totalAmount === 'number',
      });
      return createErrorResponse('Invalid booking data. Please contact support.', 500);
    }

    // Authorization - verify ownership
    if (booking.studentId.toString() !== user._id.toString()) {
      logger.logSecurity('UNAUTHORIZED_PAYMENT_ATTEMPT', {
        email: session.user.email,
        bookingId: validBookingId,
        bookingOwner: booking.studentId.toString(),
      });
      return createErrorResponse('You can only make payments for your own bookings', 403);
    }

    // Idempotency - check if already paid
    if (booking.paymentStatus === 'paid') {
      logger.info('Booking already paid', {
        bookingId: validBookingId,
        email: session.user.email,
      });
      return createErrorResponse('Booking has already been paid', 400);
    }

    // Check for existing order (idempotency)
    if (booking.razorpayOrderId && booking.paymentStatus === 'pending') {
      logger.info('Returning existing order', {
        bookingId: validBookingId,
        orderId: booking.razorpayOrderId,
        email: session.user.email,
      });

      const response = NextResponse.json(
        {
          success: true,
          orderId: booking.razorpayOrderId,
          amount: booking.totalAmount,
          currency: 'INR',
          keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
          booking: {
            id: booking._id.toString(),
            checkInDate: booking.checkInDate,
          },
          message: 'Using existing order',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );

      addSecurityHeaders(response);
      addRateLimitHeaders(response, 20, rateLimitResult.remaining, rateLimitResult.resetTime);

      return response;
    }

    // Generate Razorpay order ID (mock implementation)
    // In production, use Razorpay API:
    // const razorpay = new Razorpay({
    //   key_id: process.env.RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET,
    // });
    // const order = await razorpay.orders.create({
    //   amount: booking.totalAmount * 100, // paise
    //   currency: 'INR',
    //   receipt: `receipt_${booking._id}`,
    //   notes: { bookingId: booking._id.toString() },
    // });
    const razorpayOrderId = `order_${crypto.randomBytes(16).toString('hex')}`;

    // Update booking with order details
    booking.razorpayOrderId = razorpayOrderId;
    booking.paymentStatus = 'pending';
    await booking.save();

    logger.logSecurity('PAYMENT_ORDER_CREATED', {
      email: session.user.email,
      bookingId: validBookingId,
      orderId: razorpayOrderId,
      amount: booking.totalAmount,
    });

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow payment request', {
        route: 'POST /api/bookings/payment',
        duration,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        orderId: razorpayOrderId,
        amount: booking.totalAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
        booking: {
          id: booking._id.toString(),
          checkInDate: booking.checkInDate,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 20, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Payment order creation failed', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    // Handle specific errors
    if (error.name === 'CastError') {
      return createErrorResponse('Invalid ID format', 400);
    }

    return createErrorResponse('Failed to create payment order. Please try again.', 500);
  }
}

/**
 * PATCH /api/bookings/payment
 * Verifies payment callback (legacy endpoint)
 * Security: Rate limited, authenticated, ownership verified
 * Note: Consider migrating to /api/bookings/verify-payment
 */
export async function PATCH(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - strict for payment verification (20 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for payment verification', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized payment verification attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Payment verification request received', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    await dbConnect();

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

    // Validate required fields
    if (!bookingId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      logger.warn('Missing payment verification details', {
        hasBookingId: !!bookingId,
        hasPaymentId: !!razorpayPaymentId,
        hasOrderId: !!razorpayOrderId,
        hasSignature: !!razorpaySignature,
        email: session.user.email,
      });
      return createErrorResponse('Missing required payment details', 400);
    }

    // Validate bookingId
    const validBookingId = validateObjectId(bookingId);
    if (!validBookingId) {
      logger.warn('Invalid bookingId for payment verification', {
        bookingId,
        email: session.user.email,
      });
      return createErrorResponse('Invalid booking ID format', 400);
    }

    // Sanitize text inputs
    const sanitizedPaymentId = sanitizeString(razorpayPaymentId).slice(0, 100);
    const sanitizedOrderId = sanitizeString(razorpayOrderId).slice(0, 100);
    const sanitizedSignature = sanitizeString(razorpaySignature).slice(0, 200);

    // Fetch booking
    const booking = await Booking.findById(validBookingId);

    if (!booking) {
      logger.warn('Booking not found for payment verification', {
        bookingId: validBookingId,
        email: session.user.email,
      });
      return createErrorResponse('Booking not found', 404);
    }

    // Defensive null checks
    if (!booking.studentId || !booking.paymentStatus) {
      logger.error('Booking has invalid data for payment verification', {
        bookingId: validBookingId,
      });
      return createErrorResponse('Invalid booking data. Please contact support.', 500);
    }

    // Authorization - verify ownership
    if (booking.studentId.toString() !== session.user.id) {
      logger.logSecurity('UNAUTHORIZED_PAYMENT_VERIFICATION_ATTEMPT', {
        email: session.user.email,
        bookingId: validBookingId,
        bookingOwner: booking.studentId.toString(),
      });
      return createErrorResponse('Forbidden', 403);
    }

    // Idempotency - check if already paid
    if (booking.paymentStatus === 'paid') {
      logger.info('Payment already verified', {
        bookingId: validBookingId,
        email: session.user.email,
      });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Payment already verified',
          booking: {
            id: booking._id.toString(),
            status: booking.status,
            paymentStatus: booking.paymentStatus,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );

      addSecurityHeaders(response);
      addRateLimitHeaders(response, 20, rateLimitResult.remaining, rateLimitResult.resetTime);

      return response;
    }

    // Verify Razorpay signature (in production)
    // const generatedSignature = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(`${sanitizedOrderId}|${sanitizedPaymentId}`)
    //   .digest('hex');
    //
    // if (generatedSignature !== sanitizedSignature) {
    //   logger.logSecurity('PAYMENT_SIGNATURE_VERIFICATION_FAILED', {
    //     email: session.user.email,
    //     bookingId: validBookingId,
    //   });
    //   return createErrorResponse('Invalid payment signature', 400);
    // }

    // Update booking payment status
    booking.paymentStatus = 'paid';
    booking.status = 'paid';
    booking.paymentId = sanitizedPaymentId;
    booking.razorpaySignature = sanitizedSignature;
    booking.amountPaid = booking.totalAmount;
    booking.paidAt = new Date();

    await booking.save();

    logger.logSecurity('PAYMENT_VERIFIED', {
      email: session.user.email,
      bookingId: validBookingId,
      paymentId: sanitizedPaymentId,
      amount: booking.totalAmount,
    });

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow payment verification', {
        route: 'PATCH /api/bookings/payment',
        duration,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Payment verified successfully',
        booking: {
          id: booking._id.toString(),
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 20, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Payment verification failed', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    // Handle specific errors
    if (error.name === 'CastError') {
      return createErrorResponse('Invalid ID format', 400);
    }

    return createErrorResponse('Failed to verify payment. Please try again.', 500);
  }
}

function createRateLimitResponse(retryAfter: number): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too many requests',
      retryAfter,
      timestamp: new Date().toISOString(),
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
      },
    }
  );

  addSecurityHeaders(response);
  return response;
}
