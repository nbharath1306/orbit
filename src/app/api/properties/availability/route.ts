import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import mongoose from 'mongoose';
import {
  rateLimit,
  getRateLimitIdentifier,
  addSecurityHeaders,
  addRateLimitHeaders,
  createErrorResponse,
  validateObjectId,
  getRequestMetadata,
  sanitizeErrorForLog,
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

/**
 * GET /api/properties/availability
 * Check room availability for a property by room type
 * Security: Rate limited (public), input validation, defensive programming
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);

  try {
    // Rate limiting for public endpoint (50 req/15min)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 50, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for availability check', { ip: metadata.ip });
      return createRateLimitResponse(rateLimitResult.retryAfter!);
    }

    // Get and validate property ID
    const propertyIdRaw = req.nextUrl.searchParams.get('propertyId');

    if (!propertyIdRaw) {
      logger.warn('Missing propertyId for availability check', { ip: metadata.ip });
      return createErrorResponse('Property ID is required', 400);
    }

    const propertyId = validateObjectId(propertyIdRaw);

    if (!propertyId) {
      logger.warn('Invalid propertyId for availability check', {
        propertyId: propertyIdRaw,
        ip: metadata.ip,
      });
      return createErrorResponse('Invalid property ID format', 400);
    }

    logger.info('Availability check request received', {
      propertyId,
      ip: metadata.ip,
    });

    await dbConnect();

    // Get property with defensive checks
    const property = await Property.findById(propertyId).select('liveStats').lean();

    if (!property) {
      logger.warn('Property not found for availability check', { propertyId });
      return createErrorResponse('Property not found', 404);
    }

    // Defensive null checks
    if (!property.liveStats || typeof property.liveStats.totalRooms !== 'number') {
      logger.error('Property missing liveStats data for availability', {
        propertyId,
        hasLiveStats: !!property.liveStats,
        hasTotalRooms: typeof property.liveStats?.totalRooms === 'number',
      });
      return createErrorResponse('Property availability data incomplete. Please contact support.', 500);
    }

    // Count pending/paid/confirmed bookings by room type
    const bookingsByRoomType = await Booking.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
          status: { $in: ['pending', 'confirmed', 'paid'] },
        },
      },
      {
        $group: {
          _id: '$roomType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Create a map of room type to count
    const roomTypeCountMap = new Map<string, number>();
    bookingsByRoomType.forEach((item) => {
      if (item._id) {
        roomTypeCountMap.set(item._id, item.count || 0);
      }
    });

    // Calculate room type availability
    // These percentages can be adjusted based on business logic
    const totalRooms = property.liveStats.totalRooms;
    const roomTypeAvailability = {
      single: {
        total: Math.ceil(totalRooms * 0.3), // 30% single rooms
        booked: roomTypeCountMap.get('single') || 0,
        available: 0,
      },
      double: {
        total: Math.ceil(totalRooms * 0.3), // 30% double rooms
        booked: roomTypeCountMap.get('double') || 0,
        available: 0,
      },
      triple: {
        total: Math.ceil(totalRooms * 0.25), // 25% triple rooms
        booked: roomTypeCountMap.get('triple') || 0,
        available: 0,
      },
      quad: {
        total: Math.ceil(totalRooms * 0.15), // 15% quad rooms
        booked: roomTypeCountMap.get('quad') || 0,
        available: 0,
      },
    };

    // Calculate available rooms for each type
    Object.keys(roomTypeAvailability).forEach((type) => {
      const roomType = roomTypeAvailability[type as keyof typeof roomTypeAvailability];
      roomType.available = Math.max(0, roomType.total - roomType.booked);
    });

    logger.info('Availability check completed', {
      propertyId,
      totalRooms,
      totalBooked: Array.from(roomTypeCountMap.values()).reduce((a, b) => a + b, 0),
    });

    // Log performance
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow availability check', {
        route: 'GET /api/properties/availability',
        duration,
        propertyId,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        availability: roomTypeAvailability,
        propertyId,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    addSecurityHeaders(response);
    addRateLimitHeaders(response, 50, rateLimitResult.remaining, rateLimitResult.resetTime);

    return response;
  } catch (error: any) {
    logger.error('Availability check failed', sanitizeErrorForLog(error), {
      metadata,
    });

    // Handle specific errors
    if (error.name === 'CastError') {
      return createErrorResponse('Invalid ID format', 400);
    }

    return createErrorResponse('Failed to check availability. Please try again.', 500);
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
