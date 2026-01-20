/**
 * Admin 2FA Setup Route
 * Generates TOTP secret and QR code for two-factor authentication
 * Secured with rate limiting and audit logging
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
      logger.logAuth('2FA setup attempted without authentication', undefined, false);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: response.headers }
      );
    }

    await connectDB();

    // 2. Verify admin role from database
    const user = await User.findById(session.user.id).select('role blacklisted email twoFactorSecret').lean();

    if (!user || user.role !== 'admin') {
      logger.logAuth('2FA setup attempted by non-admin', session.user.id, false, {
        role: user?.role,
      });
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403, headers: response.headers }
      );
    }

    if (user.blacklisted) {
      logger.logSecurity('Blacklisted admin attempted 2FA setup', {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403, headers: response.headers }
      );
    }

    // 3. Rate limiting (10 setup attempts per hour)
    const identifier = getRateLimitIdentifier(req, session.user.id);
    const rateLimitResult = rateLimit(identifier, 10, 60 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.logSecurity('2FA setup rate limit exceeded', {
        userId: session.user.id,
      });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    addRateLimitHeaders(response, 10, rateLimitResult.remaining, rateLimitResult.resetTime);

    // 4. Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Orbit Admin (${user.email})`,
      issuer: 'Orbit PG',
      length: 32,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      logger.error('Failed to generate 2FA secret', { userId: session.user.id });
      return NextResponse.json(
        { error: 'Failed to generate 2FA secret' },
        { status: 500, headers: response.headers }
      );
    }

    // 5. Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      secret.otpauth_url
    )}&ecc=M`;

    // 6. Store temporary secret (will be confirmed in verify endpoint)
    await User.findByIdAndUpdate(session.user.id, {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false, // Not enabled until verified
    });

    // 7. Audit logging
    await AuditLog.create({
      adminName: session.user.name || 'Unknown Admin',
      action: '2FA Setup Initiated',
      subject: 'Security',
      details: 'Admin initiated 2FA setup',
      userId: session.user.id,
      metadata: {
        email: user.email,
      },
    });

    logger.info('2FA setup initiated', {
      userId: session.user.id,
      email: user.email,
    });

    return NextResponse.json(
      {
        success: true,
        qrCode: qrCodeUrl,
        secret: secret.base32,
        otpauth_url: secret.otpauth_url,
        message: 'Scan QR code with authenticator app (Google Authenticator, Authy, etc.)',
      },
      { status: 200, headers: response.headers }
    );
  } catch (error: any) {
    logger.error('2FA setup error', {
      error: error.message,
      stack: error.stack,
    });
    return createProductionErrorResponse(
      'Failed to setup 2FA',
      error,
      response.headers
    );
  }
}
