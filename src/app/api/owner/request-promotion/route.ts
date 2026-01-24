import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import { OwnerPromotionRequest } from '@/models/OwnerPromotionRequest';
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - POST operation (strict for promotion requests)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 10, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        ip: metadata.ip,
        url: req.url,
      });
      const response = createErrorResponse(
        'Too many requests. Please try again later.',
        429
      );
      addRateLimitHeaders(response, 10, 0, rateLimitResult.resetTime);
      return response;
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

    logger.info('Owner promotion request received', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    // Parse and validate JSON body
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { propertyId, propertyTitle } = body;

    // Validate property ID if provided
    if (propertyId) {
      const validPropertyId = validateObjectId(propertyId);
      if (!validPropertyId) {
        return createErrorResponse('Invalid property ID format', 400);
      }
    }

    // Sanitize property title
    const sanitizedTitle = propertyTitle
      ? sanitizeString(propertyTitle).slice(0, 200)
      : '';

    if (sanitizedTitle.length < 3) {
      return createErrorResponse(
        'Property title must be at least 3 characters',
        400
      );
    }

    await dbConnect();

    const User = mongoose.model('User');
    const user = await User.findById(session.user.id);

    if (!user) {
      logger.warn('User not found', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // If already owner, return error
    if (user.role === 'owner') {
      logger.info('User is already an owner', {
        email: session.user.email,
        userId: session.user.id,
      });
      return createErrorResponse('You are already an owner', 400);
    }

    // Check if already has pending request (duplicate prevention)
    const existingRequest = await OwnerPromotionRequest.findOne({
      userId: user._id,
      status: 'pending',
    });

    if (existingRequest) {
      logger.warn('Duplicate promotion request attempt', {
        email: session.user.email,
        userId: session.user.id,
        existingRequestId: existingRequest._id.toString(),
      });
      return createErrorResponse(
        'You already have a pending owner promotion request',
        409
      );
    }

    // Create new promotion request
    const promotionRequest = new OwnerPromotionRequest({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      propertyId: propertyId || null,
      propertyTitle: sanitizedTitle,
      status: 'pending',
      createdAt: new Date(),
    });

    await promotionRequest.save();

    logger.logSecurity('OWNER_PROMOTION_REQUESTED', {
      email: session.user.email,
      userId: session.user.id,
      requestId: promotionRequest._id.toString(),
      propertyTitle: sanitizedTitle,
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
        message: 'Owner promotion request submitted. Waiting for admin approval.',
        requestId: promotionRequest._id.toString(),
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(
      response,
      10,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    return response;
  } catch (error: any) {
    logger.error(
      'Error requesting owner status',
      sanitizeErrorForLog(error),
      {
        metadata,
        user: session?.user?.email || 'unknown',
      }
    );

    // Handle duplicate request error
    if (error.code === 11000) {
      return createErrorResponse('Duplicate promotion request', 409);
    }

    return createErrorResponse(
      'Failed to request owner status. Please try again later.',
      500
    );
  }
}

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

    if (!session || !session.user?.email) {
      logger.warn('Unauthorized access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Fetch promotion request received', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    await dbConnect();

    const promotionRequest = await OwnerPromotionRequest.findOne({
      userId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    logger.info('Promotion request retrieved', {
      email: session.user.email,
      hasRequest: !!promotionRequest,
      status: promotionRequest?.status || 'none',
    });

    const response = NextResponse.json(
      {
        success: true,
        promotionRequest: promotionRequest
          ? {
            id: promotionRequest._id.toString(),
            status: promotionRequest.status,
            propertyTitle: promotionRequest.propertyTitle,
            createdAt: promotionRequest.createdAt,
          }
          : null,
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
      'Error fetching promotion request',
      sanitizeErrorForLog(error),
      {
        metadata,
        user: session?.user?.email || 'unknown',
      }
    );

    return createErrorResponse(
      'Failed to fetch promotion request. Please try again later.',
      500
    );
  }
}
