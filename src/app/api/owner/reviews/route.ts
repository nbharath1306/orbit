import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Property from '@/models/Property';
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

    logger.info('Fetch owner reviews requested', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    await dbConnect();

    // Parse pagination parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Get all properties owned by this user
    const properties = await Property.find({ ownerId: session.user.id })
      .select('_id title')
      .lean();

    const propertyIds = properties.map((p: any) => p._id);

    if (propertyIds.length === 0) {
      logger.info('No properties found for owner', {
        email: session.user.email,
      });

      const response = NextResponse.json(
        {
          success: true,
          reviews: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            pageSize: limit,
            hasMore: false,
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

    // Get reviews for these properties with pagination
    const [reviews, totalCount] = await Promise.all([
      Review.find({ propertyId: { $in: propertyIds } })
        .populate('studentId', 'name email')
        .populate('propertyId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ propertyId: { $in: propertyIds } }),
    ]);

    logger.info('Owner reviews retrieved', {
      email: session.user.email,
      count: reviews.length,
      propertyCount: propertyIds.length,
      page,
      limit,
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
        reviews: reviews.map((review: any) => ({
          ...review,
          createdAt: review.createdAt?.toISOString?.() || review.createdAt,
          updatedAt: review.updatedAt?.toISOString?.() || review.updatedAt,
          ownerResponse: review.ownerResponse ? {
            comment: review.ownerResponse.comment,
            createdAt: review.ownerResponse.createdAt?.toISOString?.() || review.ownerResponse.createdAt,
          } : undefined,
        })),
        propertyCount: propertyIds.length,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          pageSize: limit,
          hasMore: skip + reviews.length < totalCount,
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
    logger.error('Error fetching owner reviews', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    return createErrorResponse(
      'Failed to fetch reviews. Please try again later.',
      500
    );
  }
}
