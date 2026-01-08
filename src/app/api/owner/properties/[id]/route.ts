import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - PATCH operation
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        ip: metadata.ip,
        url: req.url,
      });
      const response = createErrorResponse(
        'Too many requests. Please try again later.',
        429
      );
      addRateLimitHeaders(response, 20, 0, rateLimitResult.resetTime);
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

    logger.info('Update property requested', {
      email: session.user.email,
      method: req.method,
      url: req.url,
      propertyId: params.id,
    });

    // Validate property ID
    const validPropertyId = validateObjectId(params.id);
    if (!validPropertyId) {
      return createErrorResponse('Invalid property ID format', 400);
    }

    // Parse and validate JSON body
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    await dbConnect();

    const Property = mongoose.model('Property');

    // Verify property exists and ownership
    const property = await Property.findById(validPropertyId);

    if (!property) {
      logger.warn('Property not found', {
        propertyId: validPropertyId,
        email: session.user.email,
      });
      return createErrorResponse('Property not found', 404);
    }

    // Verify ownership
    if (property.ownerId.toString() !== session.user.id) {
      logger.logSecurity('UNAUTHORIZED_PROPERTY_UPDATE_ATTEMPT', {
        email: session.user.email,
        userId: session.user.id,
        propertyId: validPropertyId,
        propertyOwner: property.ownerId.toString(),
      });
      return createErrorResponse(
        'You can only update your own properties',
        403
      );
    }

    // Build update object with validation
    const updateData: any = {};

    // Title validation
    if (body.title) {
      const sanitizedTitle = sanitizeString(body.title).trim();
      if (sanitizedTitle.length < 5 || sanitizedTitle.length > 200) {
        return createErrorResponse(
          'Title must be between 5 and 200 characters',
          400
        );
      }
      updateData.title = sanitizedTitle;
    }

    // Description validation
    if (body.description) {
      const sanitizedDesc = sanitizeString(body.description).trim();
      if (sanitizedDesc.length < 10 || sanitizedDesc.length > 2000) {
        return createErrorResponse(
          'Description must be between 10 and 2000 characters',
          400
        );
      }
      updateData.description = sanitizedDesc;
    }

    // Address validation
    if (body.address) {
      const sanitizedAddress = sanitizeString(body.address).trim();
      if (sanitizedAddress.length < 10 || sanitizedAddress.length > 300) {
        return createErrorResponse(
          'Address must be between 10 and 300 characters',
          400
        );
      }
      updateData.address = sanitizedAddress;
    }

    // Price validation
    if (body.price !== undefined) {
      const numPrice = parseFloat(body.price);
      if (isNaN(numPrice) || numPrice < 1000 || numPrice > 1000000) {
        return createErrorResponse(
          'Price must be between ₹1,000 and ₹10,00,000',
          400
        );
      }
      updateData.price = numPrice;
    }

    // Rooms validation
    if (body.rooms !== undefined) {
      const numRooms = parseInt(body.rooms, 10);
      if (isNaN(numRooms) || numRooms < 1 || numRooms > 100) {
        return createErrorResponse('Rooms must be between 1 and 100', 400);
      }
      updateData.rooms = numRooms;
    }

    // Property type validation
    if (body.propertyType) {
      const validTypes = ['pg', 'hostel', 'apartment', 'room'];
      if (!validTypes.includes(body.propertyType)) {
        return createErrorResponse(
          `Property type must be one of: ${validTypes.join(', ')}`,
          400
        );
      }
      updateData.propertyType = body.propertyType;
    }

    // Furnished validation
    if (body.furnished !== undefined) {
      const validFurnished = ['fully', 'semi', 'unfurnished'];
      if (!validFurnished.includes(body.furnished)) {
        return createErrorResponse(
          `Furnished must be one of: ${validFurnished.join(', ')}`,
          400
        );
      }
      updateData.furnished = body.furnished;
    }

    // Amenities validation
    if (body.amenities && Array.isArray(body.amenities)) {
      const sanitizedAmenities = body.amenities
        .map((a: string) => sanitizeString(a).slice(0, 50))
        .filter((a: string) => a.length > 0)
        .slice(0, 20);
      updateData.amenities = sanitizedAmenities;
    }

    // Images validation
    if (body.images && Array.isArray(body.images)) {
      if (body.images.length > 10) {
        return createErrorResponse('Maximum 10 images allowed', 400);
      }
      updateData.images = body.images.slice(0, 10);
    }

    // Check if there are any updates
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400);
    }

    updateData.updatedAt = new Date();

    // Perform atomic update
    const updatedProperty = await Property.findByIdAndUpdate(
      validPropertyId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-__v');

    logger.logSecurity('PROPERTY_UPDATED', {
      email: session.user.email,
      userId: session.user.id,
      propertyId: validPropertyId,
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
        message: 'Property updated successfully',
        property: {
          id: updatedProperty._id.toString(),
          title: updatedProperty.title,
          price: updatedProperty.price,
          rooms: updatedProperty.rooms,
          updatedAt: updatedProperty.updatedAt,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(
      response,
      20,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    return response;
  } catch (error: any) {
    logger.error(
      'Error updating property',
      sanitizeErrorForLog(error),
      {
        metadata,
        user: session?.user?.email || 'unknown',
        propertyId: params.id,
      }
    );

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return createErrorResponse('Invalid property data', 400);
    }

    return createErrorResponse(
      'Failed to update property. Please try again later.',
      500
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - DELETE operation
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

    logger.info('Delete property requested', {
      email: session.user.email,
      method: req.method,
      url: req.url,
      propertyId: params.id,
    });

    // Validate property ID
    const validPropertyId = validateObjectId(params.id);
    if (!validPropertyId) {
      return createErrorResponse('Invalid property ID format', 400);
    }

    await dbConnect();

    const Property = mongoose.model('Property');
    const Booking = mongoose.model('Booking');

    // Verify property exists and ownership
    const property = await Property.findById(validPropertyId);

    if (!property) {
      logger.warn('Property not found', {
        propertyId: validPropertyId,
        email: session.user.email,
      });
      return createErrorResponse('Property not found', 404);
    }

    // Verify ownership
    if (property.ownerId.toString() !== session.user.id) {
      logger.logSecurity('UNAUTHORIZED_PROPERTY_DELETE_ATTEMPT', {
        email: session.user.email,
        userId: session.user.id,
        propertyId: validPropertyId,
        propertyOwner: property.ownerId.toString(),
      });
      return createErrorResponse(
        'You can only delete your own properties',
        403
      );
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      propertyId: validPropertyId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (activeBookings > 0) {
      logger.warn('Cannot delete property with active bookings', {
        propertyId: validPropertyId,
        email: session.user.email,
        activeBookings,
      });
      return createErrorResponse(
        'Cannot delete property with active bookings. Please wait for all bookings to complete or reject them first.',
        400
      );
    }

    // Perform deletion
    await Property.findByIdAndDelete(validPropertyId);

    logger.logSecurity('PROPERTY_DELETED', {
      email: session.user.email,
      userId: session.user.id,
      propertyId: validPropertyId,
      propertyTitle: property.title,
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
        message: 'Property deleted successfully',
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
    logger.error(
      'Error deleting property',
      sanitizeErrorForLog(error),
      {
        metadata,
        user: session?.user?.email || 'unknown',
        propertyId: params.id,
      }
    );

    return createErrorResponse(
      'Failed to delete property. Please try again later.',
      500
    );
  }
}
