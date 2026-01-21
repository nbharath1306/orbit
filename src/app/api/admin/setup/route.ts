/**
 * Admin Setup Route - DEVELOPMENT ONLY
 * Creates initial admin user and manages promotions
 * 
 * ⚠️ SECURITY: This route should be disabled in production!
 * Only accessible in development environment with strict rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import {
  rateLimit,
  getRateLimitIdentifier,
  createRateLimitResponse,
  addSecurityHeaders,
  createProductionErrorResponse,
  addRateLimitHeaders,
  validateEmail,
  sanitizeInput,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const response = new Response();
  addSecurityHeaders(response);

  try {
    // 1. CRITICAL: Block in production
    if (process.env.NODE_ENV === 'production') {
      logger.logSecurity('Admin setup route accessed in production', {
        severity: 'critical',
      });
      return NextResponse.json(
        { error: 'This endpoint is disabled in production' },
        { status: 403, headers: response.headers }
      );
    }

    // 2. Strict rate limiting (5 requests per hour for setup operations)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 5, 60 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.logSecurity('Admin setup rate limit exceeded', { identifier });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    addRateLimitHeaders(response, 5, rateLimitResult.remaining, rateLimitResult.resetTime);

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const emailToPromote = searchParams.get('email');
    const makeAdmin = searchParams.get('admin') === 'true';
    const verify = searchParams.get('verify') === 'true';

    // 3. Handle user promotion
    if (emailToPromote) {
      // Validate email format
      if (!validateEmail(emailToPromote)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400, headers: response.headers }
        );
      }

      const sanitizedEmail = sanitizeInput(emailToPromote);
      const user = await User.findOne({ email: sanitizedEmail });

      if (!user) {
        logger.warn('Setup: User not found', { email: sanitizedEmail });
        return NextResponse.json(
          {
            error: 'User not found',
            email: sanitizedEmail,
          },
          { status: 404, headers: response.headers }
        );
      }

      const updates: any = {};
      const changes: string[] = [];

      // Apply requested changes
      if (makeAdmin) {
        updates.role = 'admin';
        changes.push('promoted to admin');
      }

      if (verify) {
        updates.isVerified = true;
        changes.push('verified');
      }

      // Update user with all changes
      if (Object.keys(updates).length > 0) {
        Object.assign(user, updates);
        await user.save();

        // Audit log
        await AuditLog.create({
          adminName: 'System Setup',
          action: 'User Promotion',
          subject: 'User Management',
          details: `User ${changes.join(' and ')}: ${sanitizedEmail}`,
          userId: user._id.toString(),
          metadata: {
            changes,
            email: sanitizedEmail,
            newRole: user.role,
            isVerified: user.isVerified,
          },
        });

        logger.info('User promoted via setup', {
          email: sanitizedEmail,
          changes,
        });

        return NextResponse.json(
          {
            success: true,
            message: `User ${changes.join(' and ')} successfully`,
            email: sanitizedEmail,
            role: user.role,
            isVerified: user.isVerified,
            changes: changes,
          },
          { headers: response.headers }
        );
      } else {
        return NextResponse.json(
          {
            message: 'No changes requested',
            email: sanitizedEmail,
            note: 'Use ?admin=true to make admin, ?verify=true to verify',
          },
          { headers: response.headers }
        );
      }
    }

    // 4. Create default admin user if it doesn't exist
    const adminEmail = 'admin@orbitpg.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const newAdmin = await User.create({
        name: 'Orbit Admin',
        email: adminEmail,
        role: 'admin',
        isVerified: true,
        phone: '9999999999',
        university: 'DSU',
      });

      // Audit log
      await AuditLog.create({
        adminName: 'System Setup',
        action: 'Create Admin User',
        subject: 'User Management',
        details: 'Initial admin user created',
        userId: newAdmin._id.toString(),
        metadata: {
          email: adminEmail,
          environment: process.env.NODE_ENV,
        },
      });

      logger.info('Initial admin user created', { email: adminEmail });

      return NextResponse.json(
        {
          success: true,
          message: 'Admin user created successfully',
          email: adminEmail,
          note: 'Use Auth0 to login with this email',
        },
        { headers: response.headers }
      );
    }

    return NextResponse.json(
      {
        message: 'Admin user already exists',
        email: adminEmail,
      },
      { headers: response.headers }
    );
  } catch (error: any) {
    logger.error('Admin setup error', {
      error: error.message,
      stack: error.stack,
    });
    return createProductionErrorResponse(
      'Failed to setup admin user',
      error,
      response.headers
    );
  }
}
