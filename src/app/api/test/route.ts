import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  createRateLimitResponse,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);

  try {
    // Strict rate limiting for test endpoint (only used during development/testing)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000); // 20 req/15min

    if (!rateLimitResult.success) {
      logger.warn('Test endpoint rate limited', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Only allow in development/test environments
    if (process.env.NODE_ENV === 'production') {
      logger.logSecurity('TEST_ENDPOINT_ACCESSED_IN_PRODUCTION', {
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      });
      return createErrorResponse('Test endpoint not available in production', 403);
    }

    await dbConnect();

    const count = await Property.countDocuments();
    const all = await Property.find().limit(100).lean(); // Limit to prevent memory issues

    logger.info('Test endpoint accessed', {
      propertyCount: count,
      ip: metadata.ip,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        count,
        properties: all.map(p => ({
          id: p._id,
          name: p.title,
          address: p.location?.address,
          monthlyRate: p.price?.amount,
          status: p.status,
        })),
      },
      timestamp: new Date().toISOString(),
    });

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 20, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Test endpoint failed', sanitizeErrorForLog(error), { metadata });
    return createErrorResponse(error.message || 'Test endpoint failed', 500);
  }
}
