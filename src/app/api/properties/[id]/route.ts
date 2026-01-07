import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validateObjectId,
  validateInteger,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

/**
 * GET /api/properties/[id]
 * Get a single property by ID (public)
 * Security: Rate limited, ID validation
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const startTime = Date.now();
    const metadata = getRequestMetadata(request);

    try {
        // Rate limiting for public endpoint (50 req/15min)
        const identifier = getRateLimitIdentifier(request);
        const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);

        if (!rateLimitResult.success) {
            logger.warn('Rate limit exceeded for property details', { ip: metadata.ip });
            return createRateLimitResponse(rateLimitResult.retryAfter!);
        }

        // Get and validate property ID
        const { id } = await params;
        const validPropertyId = validateObjectId(id);

        if (!validPropertyId) {
            logger.warn('Invalid property ID format', { propertyId: id, ip: metadata.ip });
            return createErrorResponse('Invalid property ID format', 400);
        }

        logger.info('Property details request received', {
            propertyId: validPropertyId,
            ip: metadata.ip,
        });

        await dbConnect();

        const property = await Property.findById(validPropertyId)
            .populate('ownerId', 'name email image isVerified')
            .lean()
            .exec();

        if (!property) {
            logger.warn('Property not found', { propertyId: validPropertyId });
            return createErrorResponse('Property not found', 404);
        }

        // Defensive null checks
        if (!property.ownerId || !property.title) {
            logger.error('Property has invalid data', {
                propertyId: validPropertyId,
                hasOwnerId: !!property.ownerId,
                hasTitle: !!property.title,
            });
            return createErrorResponse('Invalid property data. Please contact support.', 500);
        }

        // Log performance
        const duration = Date.now() - startTime;
        if (duration > 1000) {
            logger.warn('Slow property details query', {
                route: 'GET /api/properties/[id]',
                duration,
                propertyId: validPropertyId,
            });
        }

        const response = NextResponse.json(
            {
                success: true,
                property,
                timestamp: new Date().toISOString(),
            },
            { status: 200 }
        );

        addSecurityHeaders(response);
        addRateLimitHeaders(response, 50, rateLimitResult.remaining, rateLimitResult.resetTime);

        return response;
    } catch (error: any) {
        logger.error('Property details query failed', sanitizeErrorForLog(error), {
            metadata,
        });

        // Handle specific errors
        if (error.name === 'CastError') {
            return createErrorResponse('Invalid ID format', 400);
        }

        return createErrorResponse('Failed to fetch property details. Please try again.', 500);
    }
}

/**
 * PATCH /api/properties/[id]
 * Update a property (owner/admin only)
 * Security: Rate limited, authenticated, authorized, validated
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const startTime = Date.now();
    const metadata = getRequestMetadata(request);
    let session: any = null;

    try {
        // Rate limiting (30 req/15min)
        const identifier = getRateLimitIdentifier(request);
        const rateLimitResult = rateLimit(identifier, 30, 15 * 60 * 1000);

        if (!rateLimitResult.success) {
            logger.warn('Rate limit exceeded for property update', { ip: metadata.ip });
            return createRateLimitResponse(rateLimitResult.retryAfter!);
        }

        // Authentication
        session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            logger.warn('Unauthorized property update attempt', { ip: metadata.ip });
            return createErrorResponse('Unauthorized', 401);
        }

        // Get and validate property ID
        const { id } = await params;
        const validPropertyId = validateObjectId(id);

        if (!validPropertyId) {
            logger.warn('Invalid property ID for update', {
                propertyId: id,
                email: session.user.email,
            });
            return createErrorResponse('Invalid property ID format', 400);
        }

        logger.info('Property update request received', {
            email: session.user.email,
            propertyId: validPropertyId,
        });

        await dbConnect();

        // Parse and validate input
        let body;
        try {
            body = await request.json();
        } catch {
            return createErrorResponse('Invalid JSON in request body', 400);
        }

        // Fetch property
        const property = await Property.findById(validPropertyId);

        if (!property) {
            logger.warn('Property not found for update', {
                propertyId: validPropertyId,
                email: session.user.email,
            });
            return createErrorResponse('Property not found', 404);
        }

        // Defensive null checks
        if (!property.ownerId) {
            logger.error('Property has invalid owner data', {
                propertyId: validPropertyId,
            });
            return createErrorResponse('Invalid property data. Please contact support.', 500);
        }

        // Authorization - check ownership or admin
        if (property.ownerId.toString() !== session.user.id && session.user.role !== 'admin') {
            logger.logSecurity('UNAUTHORIZED_PROPERTY_UPDATE_ATTEMPT', {
                email: session.user.email,
                propertyId: validPropertyId,
                propertyOwner: property.ownerId.toString(),
            });
            return createErrorResponse('You can only update your own properties', 403);
        }

        // Validate and update occupiedRooms if provided
        if (body.occupiedRooms !== undefined) {
            const validOccupiedRooms = validateInteger(
                body.occupiedRooms,
                0,
                property.liveStats?.totalRooms || 1000
            );

            if (validOccupiedRooms === null) {
                logger.warn('Invalid occupiedRooms value', {
                    value: body.occupiedRooms,
                    propertyId: validPropertyId,
                });
                return createErrorResponse(
                    `Occupied rooms must be between 0 and ${property.liveStats?.totalRooms || 1000}`,
                    400
                );
            }

            property.liveStats.occupiedRooms = validOccupiedRooms;
        }

        // Add more field updates as needed
        // Example: if (body.title) property.title = sanitizeString(body.title).slice(0, 200);

        await property.save();

        logger.logSecurity('PROPERTY_UPDATED', {
            email: session.user.email,
            propertyId: validPropertyId,
            updates: Object.keys(body),
        });

        // Log performance
        const duration = Date.now() - startTime;
        if (duration > 1000) {
            logger.warn('Slow property update', {
                route: 'PATCH /api/properties/[id]',
                duration,
            });
        }

        const response = NextResponse.json(
            {
                success: true,
                property,
                message: 'Property updated successfully',
                timestamp: new Date().toISOString(),
            },
            { status: 200 }
        );

        addSecurityHeaders(response);
        addRateLimitHeaders(response, 30, rateLimitResult.remaining, rateLimitResult.resetTime);

        return response;
    } catch (error: any) {
        logger.error('Property update failed', sanitizeErrorForLog(error), {
            metadata,
            user: session?.user?.email || 'unknown',
        });

        // Handle specific errors
        if (error.name === 'CastError') {
            return createErrorResponse('Invalid ID format', 400);
        }

        return createErrorResponse('Failed to update property. Please try again.', 500);
    }
}

function createRateLimitResponse(retryAfter: number): NextResponse {
    const response = NextResponse.json(
        {
            error: 'Too many requests',
            retryAfter,
            timestamp: new Date().toISOString(),
        },
        {
            status: 429,
            headers: {
                'Retry-After': retryAfter.toString(),
            },
        }
    );

    addSecurityHeaders(response);
    return response;
}
