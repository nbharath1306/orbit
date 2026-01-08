import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  sanitizeString,
  validateEmail,
  validatePhone,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

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

    if (!session?.user?.email) {
      logger.warn('Unauthorized access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Owner profile request received', {
      email: session.user.email,
      method: req.method,
      url: req.url,
    });

    await dbConnect();

    const user = await User.findOne({ email: session.user.email })
      .select('-password -__v')
      .lean();

    if (!user) {
      logger.warn('User not found', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Return safe user profile
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          avatar: user.avatar || user.image || '',
          role: user.role,
          emailVerified: user.emailVerified || false,
          createdAt: user.createdAt,
        },
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
    logger.error('Error fetching profile', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    return createErrorResponse(
      'Failed to fetch profile. Please try again later.',
      500
    );
  }
}

export async function PUT(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - POST operation
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 30, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        ip: metadata.ip,
        url: req.url,
      });
      const response = createErrorResponse(
        'Too many requests. Please try again later.',
        429
      );
      addRateLimitHeaders(response, 30, 0, rateLimitResult.resetTime);
      return response;
    }

    // Authentication validation
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logger.warn('Unauthorized access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    logger.info('Profile update request received', {
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

    const { name, email, phone, address, avatar } = body;

    // Validate and sanitize inputs
    const updateData: any = {};

    if (name !== undefined) {
      const sanitizedName = sanitizeString(name).slice(0, 100);
      if (sanitizedName.length < 2) {
        return createErrorResponse('Name must be at least 2 characters', 400);
      }
      updateData.name = sanitizedName;
    }

    if (email !== undefined) {
      const validEmail = validateEmail(email);
      if (!validEmail) {
        return createErrorResponse('Invalid email format', 400);
      }
      updateData.email = validEmail;
    }

    if (phone !== undefined) {
      if (phone) {
        const validPhone = validatePhone(phone);
        if (!validPhone) {
          return createErrorResponse('Invalid phone number format', 400);
        }
        updateData.phone = validPhone;
      } else {
        updateData.phone = '';
      }
    }

    if (address !== undefined) {
      updateData.address = address ? sanitizeString(address).slice(0, 500) : '';
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar ? sanitizeString(avatar).slice(0, 500) : '';
      updateData.image = updateData.avatar;
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      logger.warn('User not found', { email: session.user.email });
      return createErrorResponse('User not found', 404);
    }

    // Check if new email is already taken by another user
    if (updateData.email && updateData.email !== session.user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        logger.warn('Email already in use', {
          requestedEmail: updateData.email,
          user: session.user.email,
        });
        return createErrorResponse('Email already in use', 409);
      }
    }

    // Store old values for audit log
    const oldValues = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
    };

    // Update user fields
    Object.assign(user, updateData);

    await user.save();

    // Log the profile update
    logger.logSecurity('PROFILE_UPDATED', {
      email: session.user.email,
      updatedFields: Object.keys(updateData),
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
        message: 'Profile updated successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          avatar: user.avatar,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(
      response,
      30,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    return response;
  } catch (error: any) {
    logger.error('Error updating profile', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    // Handle duplicate email error
    if (error.code === 11000) {
      return createErrorResponse('Email already in use', 409);
    }

    return createErrorResponse(
      'Failed to update profile. Please try again later.',
      500
    );
  }
}
