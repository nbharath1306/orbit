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
  validatePagination,
  sanitizeString,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

const ALLOWED_FILTERS = ['all', 'active', 'completed', 'cancelled', 'pending', 'paid'];

/**
 * GET /api/user/bookings
 * Retrieves user's bookings with filtering and pagination
 * Security: Rate limited, authenticated, paginated
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - moderate for read operations (100 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 100, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for user bookings list', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized user bookings access attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('User bookings list request received', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    await dbConnect();

    // Find user with defensive check
    const user = await User.findOne({ email: session.user.email })
      .select('_id')
      .lean()
      .exec();

    if (!user) {
      logger.warn('User not found for bookings list', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const filterRaw = searchParams.get('filter') || 'all';
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');

    // Sanitize and validate filter
    const sanitizedFilter = sanitizeString(filterRaw).toLowerCase();
    const filter = ALLOWED_FILTERS.includes(sanitizedFilter) ? sanitizedFilter : 'all';

    if (!ALLOWED_FILTERS.includes(sanitizedFilter) && filterRaw !== 'all') {
      logger.warn('Invalid filter attempted', {
        filter: filterRaw,
        email: session.user.email,
      });
    }

    // Validate pagination
    const { limit, skip } = validatePagination({
      limit: limitParam,
      page: pageParam,
    });

    // Build query
    let query: Record<string, any> = { studentId: user._id };

    switch (filter) {
      case 'active':
        query.status = { $in: ['confirmed', 'paid', 'pending'] };
        break;
      case 'completed':
        query.status = 'completed';
        break;
      case 'cancelled':
        query.status = 'rejected';
        break;
      case 'pending':
        query.status = 'pending';
        break;
      case 'paid':
        query.status = 'paid';
        break;
      default:
        // 'all' - no additional filter
        break;
    }

    // Execute queries in parallel
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('propertyId', 'title slug location images')
        .populate('ownerId', 'name image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Booking.countDocuments(query).exec(),
    ]);

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow user bookings query', {
        route: 'GET /api/user/bookings',
        duration,
        filter,
        count: bookings.length,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        bookings,
        pagination: {
          total,
          page: Math.floor(skip / limit) + 1,
          totalPages: Math.ceil(total / limit),
          limit,
          skip,
        },
        filter,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 100, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('User bookings query failed', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    // Handle specific errors
    if (error.name === 'MongoError') {
      return createErrorResponse('Database query failed', 500);
    }

    return createErrorResponse('Failed to fetch bookings. Please try again.', 500);
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
