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
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - GET operation
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 100, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        ip: metadata.ip,
        url: req.url,
      });
      const response = createErrorResponse(
        'Too many requests. Please try again later.',
        429
      );
      addRateLimitHeaders(response, 100, 0, rateLimitResult.resetTime);
      return response;
    }

    // Authentication validation
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logger.warn('Unauthorized access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Owner bookings request received', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    const { searchParams } = new URL(req.url);

    // Validate filter parameter
    const filter = searchParams.get('filter') || 'pending';
    const validFilters = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'all'];

    if (!validFilters.includes(filter)) {
      logger.warn('Invalid filter parameter', {
        email: session.user.email,
        filter,
      });
      return createErrorResponse(
        `Invalid filter. Allowed values: ${validFilters.join(', ')}`,
        400
      );
    }

    // Validate pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    await dbConnect();

    // Get all properties owned by this user with defensive check
    const Property = require('@/models/Property').default;
    const properties = await Property.find({
      ownerId: new mongoose.Types.ObjectId(session.user.id),
    }).select('_id');

    const propertyIds = properties.map((p: any) => p._id);

    if (propertyIds.length === 0) {
      logger.info('No properties found for owner', {
        email: session.user.email,
      });

      const response = NextResponse.json(
        {
          success: true,
          bookings: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );

      addSecurityHeaders(response);
      addRateLimitHeaders(
        response,
        100,
        rateLimitResult.remaining,
        rateLimitResult.resetTime
      );

      return response;
    }

    // Build safe query with validated parameters
    let query: any = {
      propertyId: { $in: propertyIds },
    };

    if (filter !== 'all') {
      query.status = filter;
    }

    // Execute query with pagination and get total count
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate('studentId', 'name email image')
        .populate('propertyId', 'name location')
        .select('propertyId studentId status totalAmount startDate endDate createdAt paymentStatus')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Booking.countDocuments(query),
    ]);

    logger.info('Owner bookings retrieved', {
      email: session.user.email,
      count: bookings.length,
      filter: filter,
      page,
    });

    // Log performance warning if slow
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow request', {
        route: `${req.method} ${req.url}`,
        duration,
        user: session.user.email,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        bookings,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(
      response,
      100,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    return response;
  } catch (error: any) {
    logger.error(
      'Error fetching owner bookings',
      sanitizeErrorForLog(error),
      {
        metadata,
        user: session?.user?.email || 'unknown',
      }
    );

    return createErrorResponse(
      'Failed to fetch bookings. Please try again later.',
      500
    );
  }
}
