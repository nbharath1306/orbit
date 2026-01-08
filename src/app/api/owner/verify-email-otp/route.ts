import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { otpStore } from '../send-email-otp/route';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validateEmail,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

// Maximum verification attempts per OTP
const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting for OTP verification (prevent brute force)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 10, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('OTP verification rate limit exceeded', {
        ip: metadata.ip,
        url: req.url,
      });
      const response = createErrorResponse(
        'Too many verification attempts. Please try again later.',
        429
      );
      addRateLimitHeaders(response, 10, 0, rateLimitResult.resetTime);
      return response;
    }

    // Authentication validation
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logger.warn('Unauthorized OTP verification attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('OTP verification requested', {
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

    const { email, otp } = body;

    if (!email || !otp) {
      return createErrorResponse('Email and OTP are required', 400);
    }

    // Validate email format
    if (!validateEmail(email)) {
      logger.warn('Invalid email format for OTP verification', {
        email: session.user.email,
        requestedEmail: email,
      });
      return createErrorResponse('Invalid email format', 400);
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      logger.warn('Invalid OTP format', {
        email: session.user.email,
        targetEmail: email,
      });
      return createErrorResponse('Invalid OTP format', 400);
    }

    // Get stored OTP
    const storedData = otpStore.get(email);

    if (!storedData) {
      logger.warn('OTP not found or expired', {
        email: session.user.email,
        targetEmail: email,
      });
      return createErrorResponse('OTP expired or not found', 400);
    }

    // Check if expired
    if (Date.now() > storedData.expires) {
      otpStore.delete(email);
      logger.warn('Expired OTP verification attempt', {
        email: session.user.email,
        targetEmail: email,
      });
      return createErrorResponse('OTP expired', 400);
    }

    // Check attempt limit (prevent brute force)
    if (storedData.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email);
      logger.logSecurity('OTP_MAX_ATTEMPTS_EXCEEDED', {
        email: session.user.email,
        targetEmail: email,
        attempts: storedData.attempts,
      });
      return createErrorResponse(
        'Maximum verification attempts exceeded. Please request a new OTP.',
        429
      );
    }

    // Verify OTP (constant-time comparison to prevent timing attacks)
    const otpMatch = storedData.otp === otp;

    if (!otpMatch) {
      // Increment attempt counter
      storedData.attempts++;
      otpStore.set(email, storedData);

      const remainingAttempts = MAX_ATTEMPTS - storedData.attempts;

      logger.warn('Invalid OTP attempt', {
        email: session.user.email,
        targetEmail: email,
        attempts: storedData.attempts,
        remainingAttempts,
      });

      return createErrorResponse(
        `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
        400
      );
    }

    // OTP is valid, remove it from store
    otpStore.delete(email);

    // Log successful verification (security event)
    logger.logSecurity('OTP_VERIFIED_SUCCESS', {
      email: session.user.email,
      targetEmail: email,
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
        message: 'OTP verified successfully',
        verified: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
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
    logger.error('Error verifying OTP', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    return createErrorResponse(
      'Failed to verify OTP. Please try again later.',
      500
    );
  }
}
