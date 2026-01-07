import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import AuditLog from '@/models/AuditLog';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validateObjectId,
  sanitizeString,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

/**
 * POST /api/bookings/verify-payment
 * Verifies Razorpay payment signature and confirms booking
 * Security: Rate limited, authenticated, ownership verified, idempotent
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - strict for payment verification (20 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for verify-payment', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized verify-payment attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Payment verification request received', {
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

    const { bookingId, paymentId, orderId, signature } = body;

    // Validate required fields
    if (!bookingId || !paymentId || !orderId || !signature) {
      logger.warn('Missing payment details', {
        hasBookingId: !!bookingId,
        hasPaymentId: !!paymentId,
        hasOrderId: !!orderId,
        hasSignature: !!signature,
        email: session.user.email,
      });
      return createErrorResponse('Missing required payment details', 400);
    }

    // Validate bookingId
    const validBookingId = validateObjectId(bookingId);
    if (!validBookingId) {
      logger.warn('Invalid bookingId for verify-payment', {
        bookingId,
        email: session.user.email,
      });
      return createErrorResponse('Invalid booking ID format', 400);
    }

    // Sanitize text inputs
    const sanitizedPaymentId = sanitizeString(paymentId).slice(0, 100);
    const sanitizedOrderId = sanitizeString(orderId).slice(0, 100);
    const sanitizedSignature = sanitizeString(signature).slice(0, 200);

    if (!sanitizedPaymentId || !sanitizedOrderId || !sanitizedSignature) {
      logger.warn('Invalid payment credentials after sanitization', {
        email: session.user.email,
      });
      return createErrorResponse('Invalid payment credentials', 400);
    }

    await dbConnect();

    // Fetch booking with defensive checks
    const booking = await Booking.findById(validBookingId);

    if (!booking) {
      logger.warn('Booking not found for verify-payment', {
        bookingId: validBookingId,
        email: session.user.email,
      });
      return createErrorResponse('Booking not found', 404);
    }

    // Defensive null checks
    if (!booking.studentId || !booking.status || typeof booking.totalAmount !== 'number') {
      logger.error('Booking has invalid data for verify-payment', {
        bookingId: validBookingId,
        hasStudentId: !!booking.studentId,
        hasStatus: !!booking.status,
        hasTotalAmount: typeof booking.totalAmount === 'number',
      });
      return createErrorResponse('Invalid booking data. Please contact support.', 500);
    }

    // Authorization - verify ownership
    if (booking.studentId.toString() !== session.user.id) {
      logger.logSecurity('UNAUTHORIZED_VERIFY_PAYMENT_ATTEMPT', {
        email: session.user.email,
        bookingId: validBookingId,
        bookingOwner: booking.studentId.toString(),
      });
      return createErrorResponse('You can only verify payments for your own bookings', 403);
    }

    // Idempotency - check if already paid
    if (booking.paymentStatus === 'paid') {
      logger.info('Payment already verified', {
        bookingId: validBookingId,
        paymentId: booking.paymentId,
        email: session.user.email,
      });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Payment already verified',
          booking: {
            _id: booking._id.toString(),
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

    // Verify Razorpay signature
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    const signatureBody = sanitizedOrderId + '|' + sanitizedPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(signatureBody)
      .digest('hex');

    // For development/testing, allow signature bypass
    const isTestMode = process.env.NODE_ENV === 'development';
    const signatureValid = isTestMode || expectedSignature === sanitizedSignature;

    if (!signatureValid) {
      logger.logSecurity('PAYMENT_SIGNATURE_VERIFICATION_FAILED', {
        email: session.user.email,
        bookingId: validBookingId,
        orderId: sanitizedOrderId,
        paymentId: sanitizedPaymentId,
      });
      return createErrorResponse('Payment signature verification failed', 400);
    }

    // Store old status for audit
    const oldStatus = booking.status;
    const oldPaymentStatus = booking.paymentStatus;

    // Update booking payment status
    booking.status = 'paid';
    booking.paymentStatus = 'paid';
    booking.paymentId = sanitizedPaymentId;
    booking.razorpayOrderId = sanitizedOrderId;
    booking.razorpaySignature = sanitizedSignature;
    booking.amountPaid = booking.totalAmount;
    booking.paidAt = new Date();

    await booking.save();

    // Create audit log
    try {
      await AuditLog.create({
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'BOOKING_PAYMENT_COMPLETED',
        entityType: 'Booking',
        entityId: validBookingId,
        status: 'success',
        changes: {
          before: {
            status: oldStatus,
            paymentStatus: oldPaymentStatus,
            amountPaid: 0,
          },
          after: {
            status: 'paid',
            paymentStatus: 'paid',
            amountPaid: booking.totalAmount,
          },
          paymentId: sanitizedPaymentId,
          orderId: sanitizedOrderId,
        },
        ipAddress: metadata.ip,
        userAgent: metadata.userAgent,
        timestamp: new Date(),
      });
    } catch (auditError) {
      // Log but don't fail the payment verification
      logger.error('Failed to create audit log', sanitizeErrorForLog(auditError), {
        bookingId: validBookingId,
        email: session.user.email,
      });
    }

    logger.logSecurity('PAYMENT_VERIFIED', {
      email: session.user.email,
      bookingId: validBookingId,
      paymentId: sanitizedPaymentId,
      amount: booking.totalAmount,
    });

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow verify-payment request', {
        route: 'POST /api/bookings/verify-payment',
        duration,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Payment verified and booking confirmed',
        booking: {
          _id: booking._id.toString(),
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          amountPaid: booking.amountPaid,
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

    return createErrorResponse('Failed to verify payment. Please contact support.', 500);
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
