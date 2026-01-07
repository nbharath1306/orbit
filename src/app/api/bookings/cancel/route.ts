import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validateObjectId,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

/**
 * POST /api/bookings/cancel
 * Cancels a booking and processes refund if applicable
 * Security: Rate limited, authenticated, ownership verified, status validated
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - moderate for cancellation operations (30 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 30, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for booking cancellation', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized booking cancellation attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Booking cancellation request received', {
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

    const { bookingId } = body;

    if (!bookingId) {
      logger.warn('Missing bookingId for cancellation', {
        email: session.user.email,
      });
      return createErrorResponse('Booking ID is required', 400);
    }

    // Validate bookingId
    const validBookingId = validateObjectId(bookingId);
    if (!validBookingId) {
      logger.warn('Invalid bookingId for cancellation', {
        bookingId,
        email: session.user.email,
      });
      return createErrorResponse('Invalid booking ID format', 400);
    }

    await dbConnect();

    // Get user ID
    const user = await User.findOne({ email: session.user.email }).select('_id').lean();
    if (!user) {
      logger.warn('User not found for cancellation', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Fetch booking with defensive checks
    const booking = await Booking.findById(validBookingId);

    if (!booking) {
      logger.warn('Booking not found for cancellation', {
        bookingId: validBookingId,
        email: session.user.email,
      });
      return createErrorResponse('Booking not found', 404);
    }

    // Defensive null checks
    if (!booking.studentId || !booking.status) {
      logger.error('Booking has invalid data for cancellation', {
        bookingId: validBookingId,
        hasStudentId: !!booking.studentId,
        hasStatus: !!booking.status,
      });
      return createErrorResponse('Invalid booking data. Please contact support.', 500);
    }

    // Authorization - verify ownership
    if (booking.studentId.toString() !== user._id.toString()) {
      logger.logSecurity('UNAUTHORIZED_CANCEL_ATTEMPT', {
        email: session.user.email,
        bookingId: validBookingId,
        bookingOwner: booking.studentId.toString(),
      });
      return createErrorResponse('You can only cancel your own bookings', 403);
    }

    // Business logic - status validation
    if (booking.status === 'rejected') {
      logger.info('Booking already cancelled', {
        bookingId: validBookingId,
        email: session.user.email,
      });
      return createErrorResponse('This booking has already been cancelled', 400);
    }

    if (booking.status === 'confirmed') {
      logger.info('Cannot cancel confirmed booking', {
        bookingId: validBookingId,
        status: booking.status,
        email: session.user.email,
      });
      return createErrorResponse(
        'Cannot cancel confirmed bookings. Please contact the owner to modify your booking.',
        400
      );
    }

    if (['checked-in', 'completed'].includes(booking.status)) {
      logger.info('Cannot cancel active/completed booking', {
        bookingId: validBookingId,
        status: booking.status,
        email: session.user.email,
      });
      return createErrorResponse(`Cannot cancel ${booking.status} bookings`, 400);
    }

    // Allow cancelling pending and paid bookings only
    if (!['pending', 'paid'].includes(booking.status)) {
      logger.warn('Invalid status for cancellation', {
        bookingId: validBookingId,
        status: booking.status,
        email: session.user.email,
      });
      return createErrorResponse(`Cannot cancel bookings with status: ${booking.status}`, 400);
    }

    // Store old values for audit
    const oldStatus = booking.status;
    const oldPaymentStatus = booking.paymentStatus;

    // Update booking status
    booking.status = 'rejected';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'student';

    // Process refund if payment was made
    let refundMessage = '';
    if (booking.paymentStatus === 'paid' && typeof booking.amountPaid === 'number' && booking.amountPaid > 0) {
      booking.paymentStatus = 'refunded';
      booking.refundAmount = booking.amountPaid;
      refundMessage = ' and refund has been initiated. Please allow 5-7 business days for the refund to appear in your account.';

      logger.logSecurity('REFUND_INITIATED', {
        email: session.user.email,
        bookingId: validBookingId,
        refundAmount: booking.refundAmount,
      });
    }

    await booking.save();

    // Create audit log
    try {
      await AuditLog.create({
        userId: user._id.toString(),
        userEmail: session.user.email,
        action: 'BOOKING_CANCELLED',
        entityType: 'Booking',
        entityId: validBookingId,
        status: 'success',
        changes: {
          before: {
            status: oldStatus,
            paymentStatus: oldPaymentStatus,
          },
          after: {
            status: 'rejected',
            paymentStatus: booking.paymentStatus,
            refundAmount: booking.refundAmount,
          },
        },
        ipAddress: metadata.ip,
        userAgent: metadata.userAgent,
        timestamp: new Date(),
      });
    } catch (auditError) {
      // Log but don't fail the cancellation
      logger.error('Failed to create audit log for cancellation', sanitizeErrorForLog(auditError), {
        bookingId: validBookingId,
        email: session.user.email,
      });
    }

    logger.logSecurity('BOOKING_CANCELLED', {
      email: session.user.email,
      bookingId: validBookingId,
      oldStatus,
      refundProcessed: !!booking.refundAmount,
    });

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow booking cancellation', {
        route: 'POST /api/bookings/cancel',
        duration,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: `Booking cancelled successfully${refundMessage}`,
        booking: {
          _id: booking._id.toString(),
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          refundAmount: booking.refundAmount || 0,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 30, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Booking cancellation failed', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    // Create error audit log
    try {
      if (session?.user?.email) {
        await dbConnect();
        const user = await User.findOne({ email: session.user.email }).select('_id').lean();
        if (user) {
          await AuditLog.create({
            userId: user._id.toString(),
            userEmail: session.user.email,
            action: 'BOOKING_CANCELLED',
            entityType: 'Booking',
            status: 'error',
            errorMessage: error.message,
            ipAddress: metadata.ip,
            userAgent: metadata.userAgent,
            timestamp: new Date(),
          });
        }
      }
    } catch (logError) {
      logger.error('Failed to log error to audit', sanitizeErrorForLog(logError));
    }

    // Handle specific errors
    if (error.name === 'CastError') {
      return createErrorResponse('Invalid ID format', 400);
    }

    return createErrorResponse('Failed to cancel booking. Please try again.', 500);
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

