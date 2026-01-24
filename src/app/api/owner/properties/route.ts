import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  sanitizeString,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

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

    if (!session || !session.user?.email) {
      logger.warn('Unauthorized access attempt', {
        method: req.method,
        url: req.url,
        ip: metadata.ip,
      });
      return createErrorResponse('Unauthorized', 401);
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;
    const userEmail = (session.user as Record<string, unknown>).email as string;

    logger.info('Owner properties request received', {
      email: userEmail,
      method: req.method,
      url: req.url,
    });

    // Role validation - only owners and admins
    if (userRole !== 'owner' && userRole !== 'admin') {
      logger.logSecurity('FORBIDDEN_OWNER_PROPERTIES_ACCESS', {
        email: userEmail,
        role: userRole,
      });
      return createErrorResponse('Forbidden - Owner access required', 403);
    }

    // Validate pagination parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Validate status filter
    const status = searchParams.get('status');
    const validStatuses = ['draft', 'published', 'archived', 'all'];

    if (status && !validStatuses.includes(status)) {
      return createErrorResponse(
        `Invalid status filter. Allowed values: ${validStatuses.join(', ')}`,
        400
      );
    }

    await dbConnect();

    // Get the user to find their ID
    const user = await User.findOne({ email: userEmail }).lean();

    if (!user) {
      logger.warn('User not found', { email: userEmail });
      return createErrorResponse('User not found', 404);
    }

    // Build query with ownership filter
    let query: any = { ownerId: new mongoose.Types.ObjectId(user._id) };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch properties with pagination
    const [properties, totalCount] = await Promise.all([
      Property.find(query)
        .select('title location price status rating reviewCount images createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Property.countDocuments(query),
    ]);

    logger.info('Owner properties retrieved', {
      email: userEmail,
      count: properties.length,
      status: status || 'all',
      page,
    });

    // Log performance warning if slow
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow request', {
        route: `${req.method} ${req.url}`,
        duration,
        user: userEmail,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        properties,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
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
    logger.error(
      'Error fetching owner properties',
      sanitizeErrorForLog(error),
      {
        metadata,
        user: session?.user?.email || 'unknown',
      }
    );

    return createErrorResponse(
      'Failed to fetch properties. Please try again later.',
      500
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  let session: any = null;

  try {
    // Rate limiting - POST operation
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

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userEmail = (session.user as Record<string, unknown>).email as string;

    logger.info('Create property request received', {
      email: userEmail,
      method: req.method,
      url: req.url,
    });

    // Role validation - only owners and admins
    if (userRole !== 'owner' && userRole !== 'admin') {
      logger.logSecurity('FORBIDDEN_PROPERTY_CREATE_ATTEMPT', {
        email: userEmail,
        role: userRole,
      });
      return createErrorResponse('Forbidden - Owner access required', 403);
    }

    // Parse and validate JSON body
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Validate required fields
    if (!body.name || !body.location || !body.monthlyRate) {
      return createErrorResponse(
        'Missing required fields: name, location, monthlyRate',
        400
      );
    }

    // Sanitize text fields
    const sanitizedName = sanitizeString(body.name).slice(0, 200);
    const sanitizedLocation = sanitizeString(body.location).slice(0, 100);
    const sanitizedDescription = body.description
      ? sanitizeString(body.description).slice(0, 5000)
      : '';

    // Validate name length
    if (sanitizedName.length < 3) {
      return createErrorResponse(
        'Property name must be at least 3 characters',
        400
      );
    }

    // Validate pricing
    const monthlyRate = parseFloat(body.monthlyRate);
    if (isNaN(monthlyRate) || monthlyRate < 1000 || monthlyRate > 1000000) {
      return createErrorResponse(
        'Monthly rate must be between ₹1,000 and ₹10,00,000',
        400
      );
    }

    // Validate images if provided
    if (body.images && Array.isArray(body.images)) {
      if (body.images.length > 10) {
        return createErrorResponse('Maximum 10 images allowed', 400);
      }

      for (const image of body.images) {
        if (!image.url || typeof image.url !== 'string') {
          return createErrorResponse('Invalid image format', 400);
        }
      }
    }

    await dbConnect();

    // Get the user
    const user = await User.findOne({ email: userEmail }).lean();

    if (!user) {
      logger.warn('User not found', { email: userEmail });
      return createErrorResponse('User not found', 404);
    }

    // Create property with sanitized data
    const property = await Property.create({
      name: sanitizedName,
      location: sanitizedLocation,
      description: sanitizedDescription,
      monthlyRate: monthlyRate,
      ownerId: new mongoose.Types.ObjectId(user._id),
      images: body.images || [],
      amenities: body.amenities || [],
      totalRooms: body.totalRooms || 1,
      status: 'draft', // Default to draft
      createdAt: new Date(),
    });

    logger.logSecurity('PROPERTY_CREATED', {
      email: userEmail,
      propertyId: property._id.toString(),
      name: sanitizedName,
      location: sanitizedLocation,
    });

    // Log performance warning if slow
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow request', {
        route: `${req.method} ${req.url}`,
        duration,
        user: userEmail,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        property: {
          id: property._id.toString(),
          name: property.title,
          location: property.location,
          monthlyRate: property.price?.amount,
          status: property.status,
        },
        message: 'Property created successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
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
    logger.error('Error creating property', sanitizeErrorForLog(error), {
      metadata,
      user: session?.user?.email || 'unknown',
    });

    // Handle duplicate property name
    if (error.code === 11000) {
      return createErrorResponse('Property with this name already exists', 409);
    }

    return createErrorResponse(
      'Failed to create property. Please try again later.',
      500
    );
  }
}
