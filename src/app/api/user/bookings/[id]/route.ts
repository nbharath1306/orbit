import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Booking from '@/models/Booking';
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
 * GET /api/user/bookings/[id]
 * Retrieves a specific booking's details
 * Security: Rate limited, authenticated, ownership verified
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - moderate for read operations (100 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 100, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for booking details', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized booking details access attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized', 401);
    }

    // Get and validate booking ID
    const { id } = await params;
    const validBookingId = validateObjectId(id);

    if (!validBookingId) {
      logger.warn('Invalid booking ID for details', {
        bookingId: id,
        email: session.user.email,
      });
      return createErrorResponse('Invalid booking ID format', 400);
    }

    logger.info('Booking details request received', {
      email: session.user.email,
      bookingId: validBookingId,
      method: req.method,
    });

    await dbConnect();

    // Find user with defensive check
    const user = await User.findOne({ email: session.user.email })
      .select('_id')
      .lean()
      .exec();

    if (!user) {
      logger.warn('User not found for booking details', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Find booking with ownership check
    const booking = await Booking.findOne({
      _id: validBookingId,
      studentId: user._id, // Ensure user owns this booking
    })
      .populate('propertyId', 'title slug location images amenities pricing rooms description')
      .populate('ownerId', 'name email phone image isVerified')
      .lean()
      .exec();

    if (!booking) {
      logger.warn('Booking not found or access denied', {
        bookingId: validBookingId,
        userId: user._id.toString(),
        email: session.user.email,
      });
      return createErrorResponse('Booking not found or you do not have permission to view it', 404);
    }

    // Defensive null checks
    if (!booking.studentId || !booking.status) {
      logger.error('Booking has invalid data', {
        bookingId: validBookingId,
        hasStudentId: !!booking.studentId,
        hasStatus: !!booking.status,
      });
      return createErrorResponse('Invalid booking data. Please contact support.', 500);
    }

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow booking details query', {
        route: 'GET /api/user/bookings/[id]',
        duration,
        bookingId: validBookingId,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        booking,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 100, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Booking details query failed', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    // Handle specific errors
    if (error.name === 'CastError') {
      return createErrorResponse('Invalid ID format', 400);
    }

    return createErrorResponse('Failed to fetch booking details. Please try again.', 500);
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
