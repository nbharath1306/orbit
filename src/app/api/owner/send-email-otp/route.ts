import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import crypto from 'crypto';
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

// Temporary in-memory store for OTPs (in production, use Redis)
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>();

// Function to generate cryptographically secure 6-digit OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Strict rate limiting for OTP generation (anti-spam)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 5, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('OTP rate limit exceeded', {
        ip: metadata.ip,
        url: req.url,
      });
      const response = createErrorResponse(
        'Too many OTP requests. Please try again later.',
        429
      );
      addRateLimitHeaders(response, 5, 0, rateLimitResult.resetTime);
      return response;
    }

    // Authentication validation
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logger.warn('Unauthorized OTP request', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('OTP generation requested', {
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

    const { email } = body;

    if (!email) {
      return createErrorResponse('Email is required', 400);
    }

    // Validate email format
    if (!validateEmail(email)) {
      logger.warn('Invalid email format for OTP', {
        email: session.user.email,
        requestedEmail: email,
      });
      return createErrorResponse('Invalid email format', 400);
    }

    // Check if OTP was recently sent to this email (prevent spam)
    const existingOtp = otpStore.get(email);
    if (existingOtp && existingOtp.expires > Date.now() + 8 * 60 * 1000) {
      const waitTime = Math.ceil((existingOtp.expires - Date.now() - 8 * 60 * 1000) / 1000);
      logger.warn('OTP resend attempted too soon', {
        email: session.user.email,
        targetEmail: email,
        waitTime,
      });
      return createErrorResponse(
        `Please wait ${waitTime} seconds before requesting a new OTP`,
        429
      );
    }

    // Generate cryptographically secure OTP
    const otp = generateOTP();
    
    // Store OTP with 10 minute expiration and attempt counter
    otpStore.set(email, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    });

    // Log OTP generation (security event)
    logger.logSecurity('OTP_GENERATED', {
      email: session.user.email,
      targetEmail: email,
      expiresIn: '10 minutes',
    });

    // In development, return OTP for testing
    // In production, send via email service (SendGrid, AWS SES, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${email}: ${otp}`);
    }

    // TODO: Send email with OTP in production
    // Example with nodemailer or SendGrid:
    // await sendEmail({
    //   to: email,
    //   subject: 'Verify Your Email - Orbit',
    //   html: `Your verification code is: <strong>${otp}</strong>. This code expires in 10 minutes.`
    // });

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
        message: 'OTP sent successfully',
        expiresIn: '10 minutes',
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp }),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(
      response,
      5,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    return response;
  } catch (error: any) {
    logger.error('Error sending OTP', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    return createErrorResponse(
      'Failed to send OTP. Please try again later.',
      500
    );
  }
}

// Cleanup expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [email, data] of otpStore.entries()) {
    if (data.expires < now) {
      otpStore.delete(email);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    logger.info('Expired OTPs cleaned', { count: cleanedCount });
  }
}, 60000); // Run every minute

export { otpStore };
