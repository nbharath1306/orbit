import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validatePagination,
  validateInteger,
  validateObjectId,
  sanitizeString,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

/**
 * GET /api/reviews
 * Public endpoint to list reviews with filters and pagination
 * Security: Rate limited (public), paginated, validated filters
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);

  try {
    // Rate limiting for public endpoint (50 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for reviews list', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    logger.info('Reviews list request received', {
      method: req.method,
      url: req.url,
      ip: metadata.ip,
    });

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const propertyIdRaw = searchParams.get('propertyId');
    const studentIdRaw = searchParams.get('studentId');
    const minRatingRaw = searchParams.get('minRating');
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');

    // Validate pagination
    const { limit, skip } = validatePagination({
      limit: limitParam,
      page: pageParam,
    });

    // Validate IDs if provided
    const propertyId = propertyIdRaw ? validateObjectId(propertyIdRaw) : null;
    const studentId = studentIdRaw ? validateObjectId(studentIdRaw) : null;

    if (propertyIdRaw && !propertyId) {
      logger.warn('Invalid propertyId for reviews', { propertyId: propertyIdRaw });
      return createErrorResponse('Invalid property ID format', 400);
    }

    if (studentIdRaw && !studentId) {
      logger.warn('Invalid studentId for reviews', { studentId: studentIdRaw });
      return createErrorResponse('Invalid student ID format', 400);
    }

    // Validate rating if provided
    const minRating = minRatingRaw ? validateInteger(minRatingRaw, 1, 5) : null;
    if (minRatingRaw && minRating === null) {
      return createErrorResponse('Minimum rating must be between 1 and 5', 400);
    }

    // Build query
    const query: Record<string, any> = { status: 'approved' };

    if (propertyId) {
      query.propertyId = propertyId;
    }

    if (studentId) {
      query.studentId = studentId;
    }

    if (minRating) {
      query.rating = { $gte: minRating };
    }

    if (verifiedOnly) {
      query.isVerifiedStay = true;
    }

    // Execute queries in parallel
    const [reviews, total, avgRating, ratingDistribution] = await Promise.all([
      Review.find(query)
        .populate('studentId', 'name image')
        .populate('propertyId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Review.countDocuments(query).exec(),
      Review.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            avgCleanliness: { $avg: '$cleanliness' },
            avgCommunication: { $avg: '$communication' },
            avgAccuracy: { $avg: '$accuracy' },
            avgLocation: { $avg: '$location' },
            avgValue: { $avg: '$value' },
          },
        },
      ]).exec(),
      Review.aggregate([
        { $match: query },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]).exec(),
    ]);

    logger.info('Reviews query completed', {
      count: reviews.length,
      total,
      propertyId: propertyId || 'none',
    });

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow reviews query', {
        route: 'GET /api/reviews',
        duration,
        count: reviews.length,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        reviews,
        pagination: {
          total,
          page: Math.floor(skip / limit) + 1,
          totalPages: Math.ceil(total / limit),
          limit,
          skip,
        },
        averages: avgRating[0] || {
          avgRating: 0,
          avgCleanliness: 0,
          avgCommunication: 0,
          avgAccuracy: 0,
          avgLocation: 0,
          avgValue: 0,
        },
        ratingDistribution: ratingDistribution.reduce(
          (acc: Record<string, number>, curr: any) => {
            acc[curr._id] = curr.count;
            return acc;
          },
          {}
        ),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 50, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Reviews list query failed', sanitizeErrorForLog(error), {
      metadata,
    });
    return createErrorResponse('Failed to fetch reviews. Please try again.', 500);
  }
}

/**
 * POST /api/reviews
 * Create a new review for a property
 * Security: Rate limited (spam prevention), authenticated, validated, duplicate check
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Strict rate limiting for spam prevention (10 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 10, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for review creation', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized review creation attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized - Please log in to write a review', 401);
    }

    logger.info('Review creation request received', {
      email: session.user.email,
      method: req.method,
    });

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id').lean();
    if (!user) {
      logger.warn('User not found for review creation', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const {
      propertyId,
      bookingId,
      rating,
      cleanliness,
      communication,
      accuracy,
      location,
      value,
      comment,
      title,
      pros,
      cons,
      images,
      isAnonymous = false,
    } = body;

    // Validate propertyId
    const validPropertyId = validateObjectId(propertyId);
    if (!validPropertyId) {
      logger.warn('Invalid propertyId for review', {
        propertyId,
        email: session.user.email,
      });
      return createErrorResponse('Invalid property ID format', 400);
    }

    // Validate bookingId if provided
    let validBookingId = null;
    if (bookingId) {
      validBookingId = validateObjectId(bookingId);
      if (!validBookingId) {
        logger.warn('Invalid bookingId for review', {
          bookingId,
          email: session.user.email,
        });
        return createErrorResponse('Invalid booking ID format', 400);
      }
    }

    // Fetch and validate property
    const property = await Property.findById(validPropertyId);
    if (!property) {
      logger.warn('Property not found for review', {
        propertyId: validPropertyId,
        email: session.user.email,
      });
      return createErrorResponse('Property not found', 404);
    }

    // Validate all ratings (1-5)
    const ratings = { rating, cleanliness, communication, accuracy, location, value };
    for (const [key, val] of Object.entries(ratings)) {
      const validRating = validateInteger(val, 1, 5);
      if (validRating === null) {
        logger.warn(`Invalid ${key} value for review`, {
          [key]: val,
          email: session.user.email,
        });
        return createErrorResponse(`${key} must be between 1 and 5`, 400);
      }
    }

    // Validate comment length
    if (!comment || typeof comment !== 'string') {
      return createErrorResponse('Comment is required', 400);
    }

    const sanitizedComment = sanitizeString(comment);
    if (sanitizedComment.length < 50) {
      return createErrorResponse('Comment must be at least 50 characters', 400);
    }
    if (sanitizedComment.length > 2000) {
      return createErrorResponse('Comment must not exceed 2000 characters', 400);
    }

    // Sanitize title if provided
    const sanitizedTitle = title ? sanitizeString(title).slice(0, 100) : undefined;

    // Sanitize pros and cons arrays
    const sanitizedPros = pros?.slice(0, 10)?.map((p: string) => sanitizeString(p).slice(0, 200)) || undefined;
    const sanitizedCons = cons?.slice(0, 10)?.map((c: string) => sanitizeString(c).slice(0, 200)) || undefined;

    // Validate images array (max 5)
    const validatedImages = images?.slice(0, 5) || undefined;

    // Check if user has a completed booking (for verified stay)
    let isVerifiedStay = false;
    let stayDuration = 0;

    if (validBookingId) {
      const booking = await Booking.findById(validBookingId);

      if (booking) {
        // Defensive null checks
        if (!booking.studentId || !booking.status) {
          logger.error('Booking has invalid data for review', {
            bookingId: validBookingId,
          });
          return createErrorResponse('Invalid booking data. Please contact support.', 500);
        }

        // Verify ownership
        if (booking.studentId.toString() !== user._id.toString()) {
          logger.logSecurity('UNAUTHORIZED_REVIEW_WITH_BOOKING', {
            email: session.user.email,
            bookingId: validBookingId,
            bookingOwner: booking.studentId.toString(),
          });
          return createErrorResponse('You can only review your own bookings', 403);
        }

        isVerifiedStay = ['completed', 'checked-in', 'paid'].includes(booking.status);
        stayDuration = booking.durationMonths || 0;

        // Check if review already exists for this booking (spam prevention)
        const existingBookingReview = await Review.findOne({ bookingId: validBookingId });
        if (existingBookingReview) {
          logger.warn('Duplicate review attempt for booking', {
            bookingId: validBookingId,
            email: session.user.email,
          });
          return createErrorResponse('You have already reviewed this booking', 400);
        }
      }
    }

    // Check for duplicate reviews from same user for same property (spam prevention)
    if (!validBookingId) {
      const existingPropertyReview = await Review.findOne({
        studentId: user._id,
        propertyId: validPropertyId,
      });

      if (existingPropertyReview) {
        logger.warn('Duplicate review attempt for property', {
          propertyId: validPropertyId,
          email: session.user.email,
        });
        return createErrorResponse('You have already reviewed this property', 400);
      }
    }

    // Create review
    const review = await Review.create({
      studentId: user._id,
      propertyId: validPropertyId,
      bookingId: validBookingId || undefined,
      rating: Math.round(rating),
      cleanliness: Math.round(cleanliness),
      communication: Math.round(communication),
      accuracy: Math.round(accuracy),
      location: Math.round(location),
      value: Math.round(value),
      comment: sanitizedComment.slice(0, 2000),
      title: sanitizedTitle,
      pros: sanitizedPros,
      cons: sanitizedCons,
      images: validatedImages,
      isAnonymous: Boolean(isAnonymous),
      isVerifiedStay,
      stayDuration,
      status: 'approved', // Auto-approve for now; add moderation queue later
    });

    // Update property's average rating
    try {
      const avgRatingResult = await Review.aggregate([
        { $match: { propertyId: property._id, status: 'approved' } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            avgCleanliness: { $avg: '$cleanliness' },
            avgCommunication: { $avg: '$communication' },
            avgAccuracy: { $avg: '$accuracy' },
            avgLocation: { $avg: '$location' },
            avgValue: { $avg: '$value' },
            reviewCount: { $sum: 1 },
          },
        },
      ]);

      if (avgRatingResult.length > 0) {
        const avgData = avgRatingResult[0];
        await Property.findByIdAndUpdate(validPropertyId, {
          averageRating: Math.round(avgData.avgRating * 10) / 10,
          avgCleanliness: Math.round(avgData.avgCleanliness * 10) / 10,
          avgCommunication: Math.round(avgData.avgCommunication * 10) / 10,
          avgAccuracy: Math.round(avgData.avgAccuracy * 10) / 10,
          avgLocation: Math.round(avgData.avgLocation * 10) / 10,
          avgValue: Math.round(avgData.avgValue * 10) / 10,
          reviewCount: avgData.reviewCount,
        });
      }
    } catch (updateError) {
      // Log but don't fail the review creation
      logger.error('Failed to update property rating', sanitizeErrorForLog(updateError), {
        propertyId: validPropertyId,
        reviewId: review._id.toString(),
      });
    }

    const populatedReview = await Review.findById(review._id)
      .populate('studentId', 'name image')
      .populate('propertyId', 'title slug')
      .lean();

    // Create audit log
    try {
      await AuditLog.create({
        userId: user._id.toString(),
        userEmail: session.user.email,
        action: 'REVIEW_CREATED',
        entityType: 'Review',
        entityId: review._id.toString(),
        status: 'success',
        changes: {
          after: {
            rating,
            propertyId: validPropertyId,
            isVerifiedStay,
          },
        },
        ipAddress: metadata.ip,
        userAgent: metadata.userAgent,
        timestamp: new Date(),
      });
    } catch (auditError) {
      // Log but don't fail the review creation
      logger.error('Failed to create audit log for review', sanitizeErrorForLog(auditError), {
        reviewId: review._id.toString(),
        email: session.user.email,
      });
    }

    logger.logSecurity('REVIEW_CREATED', {
      email: session.user.email,
      reviewId: review._id.toString(),
      propertyId: validPropertyId,
      rating,
      isVerifiedStay,
    });

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow review creation', {
        route: 'POST /api/reviews',
        duration,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Review submitted successfully',
        review: populatedReview,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 10, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Review creation failed', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    // Handle duplicate key error
    if (error.code === 11000) {
      return createErrorResponse('Duplicate review detected', 409);
    }

    return createErrorResponse('Failed to create review. Please try again.', 500);
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
