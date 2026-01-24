import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import Booking from '@/models/Booking';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
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
import { OwnerPromotionRequest } from '@/models/OwnerPromotionRequest';

// GET /api/admin/properties/[id] - Get property details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 100, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Admin property details rate limited', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Verify admin authentication
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    await dbConnect();

    // Verify admin role
    const adminUser = await User.findOne({ email: session.user.email }).lean();

    if (!adminUser || adminUser.role !== 'admin') {
      logger.logSecurity('ADMIN_ACCESS_DENIED', {
        email: session.user.email,
        role: adminUser?.role || 'unknown',
        attemptedResource: 'admin/properties/[id]',
        ip: metadata.ip,
      });
      return createErrorResponse('Forbidden - Admin access required', 403);
    }

    // Validate property ID
    const { id } = await params;
    const validPropertyId = validateObjectId(id);
    if (!validPropertyId) {
      return createErrorResponse('Invalid property ID format', 400);
    }

    // Get property details
    const property = await Property.findById(validPropertyId)
      .populate('ownerId', 'name email phone')
      .lean();

    if (!property) {
      logger.warn('Property not found', {
        propertyId: validPropertyId,
        admin: session.user.email,
      });
      return createErrorResponse('Property not found', 404);
    }

    logger.info('Admin retrieved property details', {
      email: session.user.email,
      propertyId: validPropertyId,
    });

    const response = NextResponse.json({
      success: true,
      data: property,
      timestamp: new Date().toISOString(),
    });

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 100, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Admin property details failed', sanitizeErrorForLog(error), {
      metadata,
      admin: session?.user?.email || 'unknown',
    });
    return createErrorResponse('Failed to fetch property details', 500);
  }
}

// PATCH /api/admin/properties/[id] - Update property
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Admin property update rate limited', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Verify admin authentication
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    await dbConnect();

    // Verify admin role
    const adminUser = await User.findOne({ email: session.user.email }).lean();

    if (!adminUser || adminUser.role !== 'admin') {
      logger.logSecurity('ADMIN_ACCESS_DENIED', {
        email: session.user.email,
        role: adminUser?.role || 'unknown',
        attemptedResource: 'admin/properties/[id]',
        ip: metadata.ip,
      });
      return createErrorResponse('Forbidden - Admin access required', 403);
    }

    // Parse params and body
    const { id } = await params;

    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Validate property ID
    const validPropertyId = validateObjectId(id);
    if (!validPropertyId) {
      return createErrorResponse('Invalid property ID format', 400);
    }

    // Get current property
    const currentProperty = await Property.findById(validPropertyId).lean();

    if (!currentProperty) {
      logger.warn('Property not found for update', {
        propertyId: validPropertyId,
        admin: session.user.email,
      });
      return createErrorResponse('Property not found', 404);
    }

    // Build update object
    const updateData: any = {};

    if (body.name) {
      updateData.name = sanitizeString(body.name).slice(0, 200);
    }

    if (body.description) {
      updateData.description = sanitizeString(body.description).slice(0, 5000);
    }

    if (body.status) {
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(body.status)) {
        return createErrorResponse(`Status must be one of: ${validStatuses.join(', ')}`, 400);
      }
      updateData.status = body.status;
    }

    if (body.approvalStatus) {
      const validApprovalStatuses = ['pending', 'approved', 'rejected'];
      if (!validApprovalStatuses.includes(body.approvalStatus)) {
        return createErrorResponse(`Approval status must be one of: ${validApprovalStatuses.join(', ')}`, 400);
      }
      updateData.approvalStatus = body.approvalStatus;
    }

    if (body.monthlyRate !== undefined) {
      const rate = parseFloat(body.monthlyRate);
      if (isNaN(rate) || rate < 1000 || rate > 10000000) {
        return createErrorResponse('Monthly rate must be between ₹1,000 and ₹1,00,00,000', 400);
      }
      updateData.monthlyRate = rate;
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid update fields provided', 400);
    }

    // Update property
    const updatedProperty = await Property.findByIdAndUpdate(
      validPropertyId,
      updateData,
      { new: true }
    ).lean();

    // Handle owner promotion if property is approved
    if (body.approvalStatus === 'approved' && currentProperty.approvalStatus !== 'approved') {
      const owner = await User.findById(currentProperty.ownerId);

      if (owner && owner.role !== 'owner') {
        const existingRequest = await OwnerPromotionRequest.findOne({
          userId: owner._id,
          status: 'pending',
        });

        if (!existingRequest) {
          await OwnerPromotionRequest.create({
            userId: owner._id,
            userEmail: owner.email,
            userName: owner.name,
            propertyId: currentProperty._id,
            propertyTitle: currentProperty.title,
            status: 'pending',
          });
        }
      }
    }

    // Create audit log
    await AuditLog.create({
      userId: adminUser._id,
      action: 'ADMIN_PROPERTY_UPDATED',
      targetResourceId: validPropertyId,
      changes: {
        before: {
          name: currentProperty.title,
          status: currentProperty.status,
          approvalStatus: currentProperty.approvalStatus,
        },
        after: updateData,
      },
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      timestamp: new Date(),
    });

    logger.logSecurity('ADMIN_PROPERTY_UPDATED', {
      email: session.user.email,
      adminId: adminUser._id.toString(),
      propertyId: validPropertyId,
      updatedFields: Object.keys(updateData),
    });

    const response = NextResponse.json({
      success: true,
      data: updatedProperty,
      message: 'Property updated successfully',
      timestamp: new Date().toISOString(),
    });

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 50, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Admin property update failed', sanitizeErrorForLog(error), {
      metadata,
      admin: session?.user?.email || 'unknown',
    });
    return createErrorResponse('Failed to update property', 500);
  }
}

// DELETE /api/admin/properties/[id] - Delete property
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - strict for delete operations
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 30, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Admin property delete rate limited', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Verify admin authentication
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    await dbConnect();

    // Verify admin role
    const adminUser = await User.findOne({ email: session.user.email }).lean();

    if (!adminUser || adminUser.role !== 'admin') {
      logger.logSecurity('ADMIN_ACCESS_DENIED', {
        email: session.user.email,
        role: adminUser?.role || 'unknown',
        attemptedResource: 'delete property',
        ip: metadata.ip,
      });
      return createErrorResponse('Forbidden - Admin access required', 403);
    }

    // Validate property ID
    const { id } = await params;
    const validPropertyId = validateObjectId(id);
    if (!validPropertyId) {
      return createErrorResponse('Invalid property ID format', 400);
    }

    // Get property
    const property = await Property.findById(validPropertyId).lean();

    if (!property) {
      logger.warn('Property not found for deletion', {
        propertyId: validPropertyId,
        admin: session.user.email,
      });
      return createErrorResponse('Property not found', 404);
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      propertyId: validPropertyId,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (activeBookings > 0) {
      logger.warn('Cannot delete property with active bookings', {
        propertyId: validPropertyId,
        activeBookings,
        admin: session.user.email,
      });
      return createErrorResponse(
        `Cannot delete property with ${activeBookings} active booking(s). Cancel bookings first.`,
        400
      );
    }

    // Delete property
    await Property.findByIdAndDelete(validPropertyId);

    // Create audit log
    await AuditLog.create({
      userId: adminUser._id,
      action: 'ADMIN_PROPERTY_DELETED',
      targetResourceId: validPropertyId,
      changes: {
        deletedProperty: {
          name: property.title,
          ownerId: property.ownerId,
          status: property.status,
        },
      },
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      timestamp: new Date(),
    });

    logger.logSecurity('ADMIN_PROPERTY_DELETED', {
      email: session.user.email,
      adminId: adminUser._id.toString(),
      propertyId: validPropertyId,
      propertyName: property.title,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Property deleted successfully',
      timestamp: new Date().toISOString(),
    });

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 30, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Admin property deletion failed', sanitizeErrorForLog(error), {
      metadata,
      admin: session?.user?.email || 'unknown',
    });
    return createErrorResponse('Failed to delete property', 500);
  }
}
