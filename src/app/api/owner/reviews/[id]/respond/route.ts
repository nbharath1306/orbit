import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  sanitizeString,
  validateObjectId,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Await params (Next.js 15+ requirement)
    const { id: reviewId } = await params;

    // Rate limiting - POST operation (moderate for responses)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 100, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        ip: metadata.ip,
        url: req.url,
      });
      const rateLimitResponse = createErrorResponse(
        'Too many requests. Please try again later.',
        429
      );
      addRateLimitHeaders(rateLimitResponse, 100, 0, rateLimitResult.resetTime);
      return rateLimitResponse;
    }

    // Authentication validation
    session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      logger.warn('Unauthorized access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Review response requested', {
      email: session.user.email,
      method: req.method,
      url: req.url,
      reviewId: reviewId,
      reviewIdType: typeof reviewId,
      reviewIdLength: reviewId?.length,
    });

    // Validate review ID
    const validReviewId = validateObjectId(reviewId);
    if (!validReviewId) {
      logger.warn('Invalid review ID format', {
        reviewId: reviewId,
        reviewIdType: typeof reviewId,
      });
      return createErrorResponse('Invalid review ID format', 400);
    }

    // Parse and validate JSON body
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { response: responseText } = body;

    // Validate response text
    if (!responseText || typeof responseText !== 'string') {
      return createErrorResponse('Response is required', 400);
    }

    // Sanitize and validate response length
    const sanitizedResponse = sanitizeString(responseText).trim();

    if (sanitizedResponse.length === 0) {
      return createErrorResponse('Response cannot be empty', 400);
    }

    if (sanitizedResponse.length < 10) {
      return createErrorResponse(
        'Response must be at least 10 characters',
        400
      );
    }

    if (sanitizedResponse.length > 1000) {
      return createErrorResponse(
        'Response is too long (max 1000 characters)',
        400
      );
    }

    await dbConnect();

    const Review = mongoose.model('Review');
    const Property = mongoose.model('Property');

    // Get review and verify it exists
    const review = await Review.findById(validReviewId)
      .populate('propertyId', '_id title ownerId')
      .lean() as any;

    if (!review) {
      logger.warn('Review not found', {
        reviewId: validReviewId,
        email: session.user.email,
      });
      return createErrorResponse('Review not found', 404);
    }

    // Verify the property belongs to this owner
    if (!review.propertyId || !review.propertyId.ownerId) {
      logger.error('Review has invalid property data', {
        reviewId: validReviewId,
      });
      return createErrorResponse('Invalid review data', 500);
    }

    if (review.propertyId.ownerId.toString() !== session.user.id) {
      logger.logSecurity('UNAUTHORIZED_REVIEW_RESPONSE_ATTEMPT', {
        email: session.user.email,
        userId: session.user.id,
        reviewId: validReviewId,
        propertyOwner: review.propertyId.ownerId.toString(),
      });
      return createErrorResponse(
        'You can only respond to reviews on your own properties',
        403
      );
    }

    // Check if owner already responded
    if (review.ownerResponse) {
      logger.warn('Owner already responded to this review', {
        reviewId: validReviewId,
        email: session.user.email,
      });
      return createErrorResponse(
        'You have already responded to this review',
        409
      );
    }

    // Add owner response
    const updatedReview = await Review.findByIdAndUpdate(
      validReviewId,
      {
        $set: {
          ownerResponse: {
            comment: sanitizedResponse,
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );

    logger.logSecurity('REVIEW_RESPONSE_CREATED', {
      email: session.user.email,
      userId: session.user.id,
      reviewId: validReviewId,
      propertyId: review.propertyId._id.toString(),
      responseLength: sanitizedResponse.length,
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

    const httpResponse = NextResponse.json(
      {
        success: true,
        message: 'Response submitted successfully',
        review: {
          id: updatedReview._id.toString(),
          ownerResponse: updatedReview.ownerResponse,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(httpResponse);
    addRateLimitHeaders(
      httpResponse,
      100,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    return httpResponse;
  } catch (error: any) {
    logger.error(
      'Error submitting review response',
      sanitizeErrorForLog(error),
      {
        metadata,
        user: session?.user?.email || 'unknown',
        reviewId: 'error-before-params-await',
      }
    );

    return createErrorResponse(
      'Failed to submit response. Please try again later.',
      500
    );
  }
}
