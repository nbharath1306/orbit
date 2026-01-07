import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validateObjectId,
  validateInteger,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * POST /api/bookings/create-order
 * Creates a Razorpay order for payment processing
 * Security: Rate limited, authenticated, ownership verified
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - stricter for payment operations (20 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for create-order', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized create-order attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Create order request received', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { bookingId, amount } = body;

    // Validate bookingId
    const validBookingId = validateObjectId(bookingId);
    if (!validBookingId) {
      logger.warn('Invalid bookingId for create-order', {
        bookingId,
        email: session.user.email,
      });
      return createErrorResponse('Invalid booking ID format', 400);
    }

    // Validate amount
    const validAmount = validateInteger(amount, 1, 10000000); // 1 to 1 crore
    if (validAmount === null) {
      logger.warn('Invalid amount for create-order', {
        amount,
        email: session.user.email,
      });
      return createErrorResponse('Amount must be between ₹1 and ₹1,00,00,000', 400);
    }

    await dbConnect();

    // Fetch booking with defensive checks
    const booking = await Booking.findById(validBookingId).lean();

    if (!booking) {
      logger.warn('Booking not found for create-order', {
        bookingId: validBookingId,
        email: session.user.email,
      });
      return createErrorResponse('Booking not found', 404);
    }

    // Defensive null checks
    if (!booking.studentId || !booking.status || typeof booking.totalAmount !== 'number') {
      logger.error('Booking has invalid data for create-order', {
        bookingId: validBookingId,
        hasStudentId: !!booking.studentId,
        hasStatus: !!booking.status,
        hasTotalAmount: typeof booking.totalAmount === 'number',
      });
      return createErrorResponse('Invalid booking data. Please contact support.', 500);
    }

    // Authorization - verify ownership
    if (booking.studentId.toString() !== session.user.id) {
      logger.logSecurity('UNAUTHORIZED_CREATE_ORDER_ATTEMPT', {
        email: session.user.email,
        bookingId: validBookingId,
        bookingOwner: booking.studentId.toString(),
      });
      return createErrorResponse('You can only create orders for your own bookings', 403);
    }

    // Business logic - status validation
    if (booking.status !== 'confirmed') {
      logger.info('Invalid booking status for create-order', {
        bookingId: validBookingId,
        status: booking.status,
        email: session.user.email,
      });
      return createErrorResponse(`Cannot create order for ${booking.status} booking`, 400);
    }

    // Verify amount matches booking amount
    if (Math.abs(validAmount - booking.totalAmount) > 0.01) {
      logger.warn('Amount mismatch for create-order', {
        requestedAmount: validAmount,
        bookingAmount: booking.totalAmount,
        bookingId: validBookingId,
        email: session.user.email,
      });
      return createErrorResponse('Amount does not match booking total', 400);
    }

    // Check for existing order (idempotency)
    if (booking.razorpayOrderId && booking.paymentStatus !== 'failed') {
      logger.info('Order already exists', {
        bookingId: validBookingId,
        orderId: booking.razorpayOrderId,
        paymentStatus: booking.paymentStatus,
        email: session.user.email,
      });

      const response = NextResponse.json(
        {
          success: true,
          orderId: booking.razorpayOrderId,
          key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
          bookingId: validBookingId,
          amount: booking.totalAmount,
          message: 'Using existing order',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );

      addSecurityHeaders(response);
      addRateLimitHeaders(response, 20, rateLimitResult.remaining, rateLimitResult.resetTime);

      return response;
    }

    // Generate order ID (in production, create Razorpay order via API)
    const orderId = `order_${crypto.randomBytes(16).toString('hex')}`;

    // Update booking with order ID
    await Booking.findByIdAndUpdate(validBookingId, {
      razorpayOrderId: orderId,
      paymentStatus: 'pending',
    });

    logger.logSecurity('PAYMENT_ORDER_CREATED', {
      email: session.user.email,
      bookingId: validBookingId,
      orderId,
      amount: booking.totalAmount,
    });

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow create-order request', {
        route: 'POST /api/bookings/create-order',
        duration,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        orderId,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
        bookingId: validBookingId,
        amount: booking.totalAmount,
        currency: 'INR',
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 20, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Create order failed', sanitizeErrorForLog(error), {
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
