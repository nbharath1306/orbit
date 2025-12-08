import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Booking from '@/models/Booking';
import {
  rateLimit,
  getClientIp,
  createErrorResponse,
  addSecurityHeaders,
  validatePagination,
  sanitizeInput,
} from '@/lib/security';

const ALLOWED_FILTERS = ['all', 'active', 'completed', 'cancelled', 'pending'];

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`bookings-${clientIp}`, 100, 60000); // 100 requests per minute

    if (!rateLimitResult.success) {
      const response = createErrorResponse('Too many requests', 429);
      response.headers.set('Retry-After', String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)));
      return addSecurityHeaders(response);
    }

    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    // Database connection with timeout
    await dbConnect();

    // Find user
    const user = await User.findOne({ email: session.user.email })
      .select('_id')
      .lean()
      .exec();

    if (!user) {
      return addSecurityHeaders(createErrorResponse('User not found', 404));
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const filterRaw = searchParams.get('filter') || 'all';
    const limitRaw = parseInt(searchParams.get('limit') || '10');
    const skipRaw = parseInt(searchParams.get('skip') || '0');

    // Sanitize and validate filter
    const filter = ALLOWED_FILTERS.includes(sanitizeInput(filterRaw))
      ? sanitizeInput(filterRaw)
      : 'all';

    // Validate pagination
    const { limit, skip } = validatePagination(limitRaw, skipRaw);

    // Build query
    let query: Record<string, any> = { studentId: user._id };

    switch (filter) {
      case 'active':
        query.$or = [{ status: 'confirmed' }, { status: 'paid' }, { status: 'pending' }];
        break;
      case 'completed':
        query.status = 'confirmed';
        break;
      case 'cancelled':
        query.status = 'rejected';
        break;
      case 'pending':
        query.status = 'pending';
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

    const response = NextResponse.json({
      bookings,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
      filter,
      limit,
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));

    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return addSecurityHeaders(
      createErrorResponse(
        'Failed to fetch bookings',
        500,
        process.env.NODE_ENV === 'development' ? message : undefined
      )
    );
  }
}
