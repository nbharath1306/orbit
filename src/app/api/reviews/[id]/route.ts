import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Property from '@/models/Property';
import User from '@/models/User';
import mongoose from 'mongoose';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validateObjectId,
  validateInteger,
  sanitizeString,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

/**
 * GET /api/reviews/[id]
 * Get a single review by ID (public)
 * Security: Rate limited, ID validation
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);

  try {
    // Rate limiting for public endpoint (50 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for review details', { ip: metadata.ip });
      return createErrorResponse('Too many requests. Please try again later.', 429);
    }

    const { id } = await context.params;

    // Validate review ID
    const validReviewId = validateObjectId(id);
    if (!validReviewId) {
      logger.warn('Invalid review ID', { reviewId: id, ip: metadata.ip });
      return createErrorResponse('Invalid review ID format', 400);
    }

    logger.info('Review details request received', {
      reviewId: validReviewId,
      ip: metadata.ip,
    });

    await dbConnect();

    const review = await Review.findById(validReviewId)
      .populate('studentId', 'name image')
      .populate('propertyId', 'title slug location')
      .lean();

    if (!review) {
      logger.warn('Review not found', { reviewId: validReviewId });
      return createErrorResponse('Review not found', 404);
    }

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow review details query', {
        route: 'GET /api/reviews/[id]',
        duration,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        review,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 50, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Review details query failed', sanitizeErrorForLog(error), {
      metadata,
    });

    if (error.name === 'CastError') {
      return createErrorResponse('Invalid ID format', 400);
    }

    return createErrorResponse('Failed to fetch review. Please try again.', 500);
  }
}

// PUT - Edit a review (author only)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  
  try {
    // Rate limiting for review editing (30 per hour)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 30, 60 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for review edit', { ip: metadata.ip });
      return createErrorResponse('Too many requests. Please try again later.', 429);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized review edit attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized - Please log in to edit a review', 401);
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id').lean();
    if (!user) {
      logger.warn('User not found for review edit', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    const { id } = await context.params;
    
    // Validate review ID
    const validReviewId = validateObjectId(id);
    if (!validReviewId) {
      logger.warn('Invalid review ID for edit', { reviewId: id, email: session.user.email });
      return createErrorResponse('Invalid review ID format', 400);
    }

    // Get the review
    const review = await Review.findById(validReviewId);
    if (!review) {
      logger.warn('Review not found for edit', { reviewId: validReviewId });
      return createErrorResponse('Review not found', 404);
    }

    // Only author can edit their review
    if (review.studentId.toString() !== user._id.toString()) {
      logger.logSecurity('UNAUTHORIZED_REVIEW_EDIT_ATTEMPT', {
        email: session.user.email,
        reviewId: validReviewId,
        reviewAuthor: review.studentId.toString()
      });
      return createErrorResponse('You can only edit your own reviews', 403);
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const {
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
    } = body;

    // Validate all ratings (1-5)
    const ratings: Record<string, number> = { rating, cleanliness, communication, accuracy, location, value };
    for (const [key, val] of Object.entries(ratings)) {
      if (val !== undefined) {
        const validRating = validateInteger(val, 1, 5);
        if (validRating === null) {
          logger.warn(`Invalid ${key} value for review edit`, {
            [key]: val,
            email: session.user.email,
          });
          return createErrorResponse(`${key} must be between 1 and 5`, 400);
        }
      }
    }

    // Validate comment if provided
    if (comment !== undefined) {
      if (typeof comment !== 'string') {
        return createErrorResponse('Comment must be a string', 400);
      }

      const sanitizedComment = sanitizeString(comment);
      if (sanitizedComment.length < 50) {
        return createErrorResponse('Comment must be at least 50 characters', 400);
      }
      if (sanitizedComment.length > 2000) {
        return createErrorResponse('Comment must not exceed 2000 characters', 400);
      }
      review.comment = sanitizedComment.slice(0, 2000);
    }

    // Update ratings
    if (rating !== undefined) review.rating = Math.round(rating);
    if (cleanliness !== undefined) review.cleanliness = Math.round(cleanliness);
    if (communication !== undefined) review.communication = Math.round(communication);
    if (accuracy !== undefined) review.accuracy = Math.round(accuracy);
    if (location !== undefined) review.location = Math.round(location);
    if (value !== undefined) review.value = Math.round(value);

    // Update title if provided
    if (title !== undefined) {
      const sanitizedTitle = sanitizeString(title).slice(0, 100);
      review.title = sanitizedTitle || undefined;
    }

    // Update pros and cons
    if (pros !== undefined && Array.isArray(pros)) {
      review.pros = pros
        .slice(0, 10)
        .filter((p: string) => p && p.trim())
        .map((p: string) => sanitizeString(p).slice(0, 200));
    }

    if (cons !== undefined && Array.isArray(cons)) {
      review.cons = cons
        .slice(0, 10)
        .filter((c: string) => c && c.trim())
        .map((c: string) => sanitizeString(c).slice(0, 200));
    }

    // Save updated review
    await review.save();

    logger.info('Review edited successfully', {
      reviewId: validReviewId,
      email: session.user.email,
      duration: Date.now() - startTime,
    });

    // Populate for response
    const populatedReview = await Review.findById(validReviewId)
      .populate('studentId', 'name image')
      .populate('propertyId', 'title slug')
      .lean();

    const response = NextResponse.json(
      {
        success: true,
        message: '✅ Review updated successfully',
        review: populatedReview,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 30, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Review edit failed', sanitizeErrorForLog(error), { metadata });
    return createErrorResponse('Failed to update review. Please try again.', 500);
  }
}

// PATCH - Update review with additional actions (owner response, helpful, report, moderate)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);

  try {
    // Rate limiting (20 per 15 minutes)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for review action', { ip: metadata.ip });
      return createErrorResponse('Too many requests. Please try again later.', 429);
    }

    const { id } = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized review action attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized', 401);
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id role').lean();
    if (!user) {
      logger.warn('User not found for review action', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Validate review ID
    const validReviewId = validateObjectId(id);
    if (!validReviewId) {
      return createErrorResponse('Invalid review ID format', 400);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { action, response, reason } = body;

    const review = await Review.findById(validReviewId).populate('propertyId');
    if (!review) {
      logger.warn('Review not found for action', { reviewId: validReviewId });
      return createErrorResponse('Review not found', 404);
    }

    switch (action) {
      case 'respond':
        // Owner responds to review
        const property = await Property.findById(review.propertyId).lean();
        const isOwner = property?.ownerId?.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) {
          logger.logSecurity('UNAUTHORIZED_OWNER_RESPONSE', {
            email: session.user.email,
            reviewId: validReviewId,
          });
          return createErrorResponse('Only property owner can respond', 403);
        }

        if (!response || response.length < 10 || response.length > 1000) {
          return createErrorResponse('Response must be between 10 and 1000 characters', 400);
        }

        review.ownerResponse = {
          comment: sanitizeString(response).slice(0, 1000),
          respondedAt: new Date(),
        };
        break;

      case 'helpful':
        // Mark review as helpful (any user)
        review.helpfulCount += 1;
        break;

      case 'report':
        // Report review
        review.reportCount += 1;

        // Auto-flag if multiple reports
        if (review.reportCount >= 5 && review.status !== 'flagged') {
          review.status = 'flagged';
          logger.info('Review auto-flagged due to multiple reports', { reviewId: validReviewId });
        }
        break;

      case 'moderate':
        // Admin moderation
        if (user.role !== 'admin') {
          logger.logSecurity('UNAUTHORIZED_MODERATION_ATTEMPT', {
            email: session.user.email,
            reviewId: validReviewId,
          });
          return createErrorResponse('Admin access required', 403);
        }

        const newStatus = body.status;
        if (!['approved', 'rejected', 'flagged', 'pending'].includes(newStatus)) {
          return createErrorResponse('Invalid status', 400);
        }

        review.status = newStatus;
        review.moderationReason = reason ? sanitizeString(reason).slice(0, 500) : undefined;
        review.moderatedBy = new mongoose.Types.ObjectId(user._id);
        review.moderatedAt = new Date();
        break;

      default:
        return createErrorResponse('Invalid action', 400);
    }

    await review.save();

    logger.info('Review action completed successfully', {
      action,
      reviewId: validReviewId,
      email: session.user.email,
      duration: Date.now() - startTime,
    });

    const populatedReview = await Review.findById(validReviewId)
      .populate('studentId', 'name image')
      .populate('propertyId', 'title slug')
      .lean();

    const responseObj = NextResponse.json(
      {
        success: true,
        message: 'Review updated successfully',
        review: populatedReview,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(responseObj);
    addRateLimitHeaders(responseObj, 20, rateLimitResult.remaining, rateLimitResult.resetTime);

    return responseObj;
  } catch (error: any) {
    logger.error('Review action failed', sanitizeErrorForLog(error), { metadata });
    return createErrorResponse('Failed to update review', 500);
  }
}

// DELETE - Delete review (student or admin only)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);

  try {
    // Rate limiting (30 per hour)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 30, 60 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for review deletion', { ip: metadata.ip });
      return createErrorResponse('Too many requests. Please try again later.', 429);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized review deletion attempt', { ip: metadata.ip });
      return createErrorResponse('Unauthorized - Please log in to delete a review', 401);
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id role').lean();
    if (!user) {
      logger.warn('User not found for review deletion', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    const { id } = await context.params;

    // Validate review ID
    const validReviewId = validateObjectId(id);
    if (!validReviewId) {
      logger.warn('Invalid review ID for deletion', { reviewId: id, email: session.user.email });
      return createErrorResponse('Invalid review ID format', 400);
    }

    const review = await Review.findById(validReviewId);
    if (!review) {
      logger.warn('Review not found for deletion', { reviewId: validReviewId });
      return createErrorResponse('Review not found', 404);
    }

    // Only author or admin can delete
    const isAuthor = review.studentId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      logger.logSecurity('UNAUTHORIZED_REVIEW_DELETION_ATTEMPT', {
        email: session.user.email,
        reviewId: validReviewId,
        reviewAuthor: review.studentId.toString()
      });
      return createErrorResponse('You can only delete your own reviews', 403);
    }

    await Review.findByIdAndDelete(validReviewId);

    logger.info('Review deleted successfully', {
      reviewId: validReviewId,
      email: session.user.email,
      deletedBy: isAuthor ? 'author' : 'admin',
      duration: Date.now() - startTime,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: '✅ Review deleted successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 30, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Review deletion failed', sanitizeErrorForLog(error), { metadata });
    return createErrorResponse('Failed to delete review. Please try again.', 500);
  }
}
