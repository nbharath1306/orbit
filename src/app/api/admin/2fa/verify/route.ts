/**
 * Admin 2FA Verification Route
 * Verifies TOTP code and enables two-factor authentication
 * Secured with rate limiting, brute force protection, and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import connectDB from '@/lib/db';
import speakeasy from 'speakeasy';
import {
  rateLimit,
  getRateLimitIdentifier,
  createRateLimitResponse,
  addSecurityHeaders,
  createProductionErrorResponse,
  addRateLimitHeaders,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

async function getAuthOptions() {
  try {
    const { authOptions } = await import('../../../auth/[...nextauth]/route');
    return authOptions;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const response = new Response();
  addSecurityHeaders(response);

  try {
    // 1. Authentication check
    const authOptions = await getAuthOptions();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      logger.logAuth('2FA verification attempted without authentication', undefined, false);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: response.headers }
      );
    }

    await connectDB();

    // 2. Verify admin role from database
    const user = await User.findById(session.user.id).select(
      'role blacklisted email twoFactorSecret twoFactorEnabled'
    );

    if (!user || user.role !== 'admin') {
      logger.logAuth('2FA verification attempted by non-admin', session.user.id, false, {
        role: user?.role,
      });
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403, headers: response.headers }
      );
    }

    if (user.blacklisted) {
      logger.logSecurity('Blacklisted admin attempted 2FA verification', {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403, headers: response.headers }
      );
    }

    // 3. Strict rate limiting (10 attempts per hour to prevent brute force)
    const identifier = getRateLimitIdentifier(req, session.user.id);
    const rateLimitResult = rateLimit(identifier, 10, 60 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.logSecurity('2FA verification rate limit exceeded', {
        userId: session.user.id,
      });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    addRateLimitHeaders(response, 10, rateLimitResult.remaining, rateLimitResult.resetTime);

    // 4. Validate request body
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      logger.warn('2FA verification attempted without code', { userId: session.user.id });
      return NextResponse.json(
        { error: 'Verification code required' },
        { status: 400, headers: response.headers }
      );
    }

    // 5. Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      logger.warn('Invalid 2FA code format', { userId: session.user.id });
      return NextResponse.json(
        { error: 'Invalid code format. Must be 6 digits' },
        { status: 400, headers: response.headers }
      );
    }

    // 6. Check if user has a secret set up
    if (!user.twoFactorSecret) {
      logger.warn('2FA verification attempted without setup', { userId: session.user.id });
      return NextResponse.json(
        { error: '2FA not set up. Please run setup first' },
        { status: 400, headers: response.headers }
      );
    }

    // 7. Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before/after for clock drift
    });

    if (!isValid) {
      logger.logAuth(
        '2FA verification failed - invalid code',
        session.user.id,
        false,
        {
          attemptsRemaining: rateLimitResult.remaining - 1,
        }
      );

      return NextResponse.json(
        {
          error: 'Invalid verification code',
          attemptsRemaining: rateLimitResult.remaining - 1,
        },
        { status: 400, headers: response.headers }
      );
    }

    // 8. Enable 2FA for user
    user.twoFactorEnabled = true;
    await user.save();

    // 9. Audit logging
    await AuditLog.create({
      adminName: session.user.name || 'Unknown Admin',
      action: '2FA Enabled',
      subject: 'Security',
      details: 'Admin successfully enabled two-factor authentication',
      userId: session.user.id,
      metadata: {
        email: user.email,
        verificationTime: new Date().toISOString(),
      },
    });

    logger.info('2FA enabled successfully', {
      userId: session.user.id,
      email: user.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: '2FA enabled successfully',
        twoFactorEnabled: true,
      },
      { status: 200, headers: response.headers }
    );
  } catch (error: any) {
    logger.error('2FA verification error', {
      error: error.message,
      stack: error.stack,
    });
    return createProductionErrorResponse(
      'Failed to verify 2FA',
      error,
      response.headers
    );
  }
}
