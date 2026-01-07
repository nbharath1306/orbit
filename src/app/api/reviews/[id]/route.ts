import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';
import mongoose from 'mongoose';
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
      return createRateLimitResponse(rateLimitResult.retryAfter!);
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

// PATCH - Update review or add owner response
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`review-update-${clientIp}`, 20, 60000);

    if (!rateLimitResult.success) {
      return addSecurityHeaders(createErrorResponse('Too many requests', 429));
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id role').lean();
    if (!user) {
      return addSecurityHeaders(createErrorResponse('User not found', 404));
    }

    const reviewId = id;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return addSecurityHeaders(createErrorResponse('Invalid review ID', 400));
    }

    const body = await req.json();
    const { action, response, reason } = body;

    const review = await Review.findById(reviewId).populate('propertyId');
    if (!review) {
      return addSecurityHeaders(createErrorResponse('Review not found', 404));
    }

    switch (action) {
      case 'respond':
        // Owner responds to review
        const isOwner = (review.propertyId as any).ownerId.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) {
          return addSecurityHeaders(createErrorResponse('Only property owner can respond', 403));
        }

        if (!response || response.length < 10 || response.length > 1000) {
          return addSecurityHeaders(
            createErrorResponse('Response must be between 10 and 1000 characters', 400)
          );
        }

        review.ownerResponse = {
          comment: sanitizeInput(response),
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
        }

        break;

      case 'moderate':
        // Admin moderation
        if (user.role !== 'admin') {
          return addSecurityHeaders(createErrorResponse('Admin access required', 403));
        }

        const newStatus = body.status;
        if (!['approved', 'rejected', 'flagged', 'pending'].includes(newStatus)) {
          return addSecurityHeaders(createErrorResponse('Invalid status', 400));
        }

        review.status = newStatus;
        review.moderationReason = reason;
        review.moderatedBy = user._id;
        review.moderatedAt = new Date();

        break;

      default:
        return addSecurityHeaders(createErrorResponse('Invalid action', 400));
    }

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('studentId', 'name image')
      .populate('propertyId', 'title slug')
      .lean();

    return addSecurityHeaders(
      NextResponse.json({
        message: 'Review updated successfully',
        review: populatedReview,
      })
    );
  } catch (error) {
    console.error('Error updating review:', error);
    return addSecurityHeaders(createErrorResponse('Failed to update review', 500));
  }
}

// DELETE - Delete review (student or admin only)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id role').lean();
    if (!user) {
      return addSecurityHeaders(createErrorResponse('User not found', 404));
    }

    const reviewId = id;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return addSecurityHeaders(createErrorResponse('Invalid review ID', 400));
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return addSecurityHeaders(createErrorResponse('Review not found', 404));
    }

    // Only student who wrote the review or admin can delete
    const isAuthor = review.studentId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return addSecurityHeaders(createErrorResponse('Access denied', 403));
    }

    await Review.findByIdAndDelete(reviewId);

    return addSecurityHeaders(
      NextResponse.json({ message: 'Review deleted successfully' })
    );
  } catch (error) {
    console.error('Error deleting review:', error);
    return addSecurityHeaders(createErrorResponse('Failed to delete review', 500));
  }
}
