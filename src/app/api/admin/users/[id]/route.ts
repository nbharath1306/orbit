import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  createRateLimitResponse,
  validateObjectId,
  sanitizeString,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

// GET /api/admin/users/[id] - Get user details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 100, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Admin user details rate limited', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Verify admin authentication
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logger.warn('Unauthorized admin access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    await dbConnect();

    // Verify admin role
    const adminUser = await User.findOne({ email: session.user.email }).lean();

    if (!adminUser || adminUser.role !== 'admin') {
      logger.logSecurity('ADMIN_ACCESS_DENIED', {
        email: session.user.email,
        role: adminUser?.role || 'unknown',
        attemptedResource: `admin/users/${id}`,
        ip: metadata.ip,
      });
      return createErrorResponse('Forbidden - Admin access required', 403);
    }

    // Validate user ID
    const validUserId = validateObjectId(id);
    if (!validUserId) {
      return createErrorResponse('Invalid user ID format', 400);
    }

    // Get user details
    const user = await User.findById(validUserId)
      .select('-password -verificationToken -resetPasswordToken')
      .lean();

    if (!user) {
      logger.warn('User not found', {
        userId: validUserId,
        admin: session.user.email,
      });
      return createErrorResponse('User not found', 404);
    }

    logger.info('Admin retrieved user details', {
      email: session.user.email,
      targetUserId: validUserId,
      targetUserEmail: user.email,
    });

    logger.logSecurity('ADMIN_USER_DETAILS_ACCESSED', {
      email: session.user.email,
      adminId: adminUser._id.toString(),
      targetUserId: validUserId,
      targetUserEmail: user.email,
    });

    const response = NextResponse.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 100, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Admin user details failed', sanitizeErrorForLog(error), {
      metadata,
      admin: session?.user?.email || 'unknown',
      userId: id,
    });
    return createErrorResponse('Failed to fetch user details', 500);
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Admin user update rate limited', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Verify admin authentication
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logger.warn('Unauthorized admin access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    await dbConnect();

    // Verify admin role
    const adminUser = await User.findOne({ email: session.user.email }).lean();

    if (!adminUser || adminUser.role !== 'admin') {
      logger.logSecurity('ADMIN_ACCESS_DENIED', {
        email: session.user.email,
        role: adminUser?.role || 'unknown',
        attemptedResource: `admin/users/${id}`,
        ip: metadata.ip,
      });
      return createErrorResponse('Forbidden - Admin access required', 403);
    }

    // Validate user ID
    const validUserId = validateObjectId(id);
    if (!validUserId) {
      return createErrorResponse('Invalid user ID format', 400);
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Get current user
    const currentUser = await User.findById(validUserId).lean();

    if (!currentUser) {
      logger.warn('User not found for update', {
        userId: validUserId,
        admin: session.user.email,
      });
      return createErrorResponse('User not found', 404);
    }

    // Prevent admin from modifying their own role
    if (validUserId === adminUser._id.toString() && body.role && body.role !== adminUser.role) {
      logger.logSecurity('ADMIN_SELF_ROLE_MODIFICATION_ATTEMPT', {
        email: session.user.email,
        adminId: adminUser._id.toString(),
        attemptedRole: body.role,
      });
      return createErrorResponse('Cannot modify your own role', 403);
    }

    // Build update object
    const updateData: any = {};

    if (body.name) {
      updateData.name = sanitizeString(body.name).slice(0, 100);
    }

    if (body.role) {
      const validRoles = ['student', 'owner', 'admin'];
      if (!validRoles.includes(body.role)) {
        return createErrorResponse(`Role must be one of: ${validRoles.join(', ')}`, 400);
      }
      updateData.role = body.role;
    }

    if (body.status) {
      const validStatuses = ['active', 'blacklisted', 'suspended'];
      if (!validStatuses.includes(body.status)) {
        return createErrorResponse(`Status must be one of: ${validStatuses.join(', ')}`, 400);
      }
      updateData.status = body.status;
    }

    if (body.phone) {
      updateData.phone = sanitizeString(body.phone).slice(0, 20);
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid update fields provided', 400);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      validUserId,
      updateData,
      { new: true }
    )
      .select('-password -verificationToken -resetPasswordToken')
      .lean();

    // Create audit log
    await AuditLog.create({
      userId: adminUser._id,
      action: 'ADMIN_USER_UPDATED',
      targetUserId: validUserId,
      changes: {
        before: {
          name: currentUser.name,
          role: currentUser.role,
          phone: currentUser.phone,
        },
        after: updateData,
      },
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      timestamp: new Date(),
    });

    logger.logSecurity('ADMIN_USER_UPDATED', {
      email: session.user.email,
      adminId: adminUser._id.toString(),
      targetUserId: validUserId,
      targetUserEmail: currentUser.email,
      updatedFields: Object.keys(updateData),
    });

    const response = NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
    });

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 50, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Admin user update failed', sanitizeErrorForLog(error), {
      metadata,
      admin: session?.user?.email || 'unknown',
      userId: id,
    });

    if (error.code === 11000) {
      return createErrorResponse('Duplicate entry detected', 409);
    }

    return createErrorResponse('Failed to update user', 500);
  }
}
