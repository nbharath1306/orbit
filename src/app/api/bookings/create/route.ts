import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import User from '@/models/User';
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
  sanitizeString,
  getRequestMetadata,
  sanitizeErrorForLog
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';
import { createAuditLog } from '@/lib/audit';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const metadata = getRequestMetadata(req);
    let session: any = null;
    
    try {
        // Enhanced rate limiting - 20 bookings per 15 minutes (more reasonable)
        const identifier = getRateLimitIdentifier(req);
        const rateLimitResult = rateLimit(identifier, 20, 15 * 60 * 1000);

        if (!rateLimitResult.success) {
            logger.warn('Rate limit exceeded', { ip: metadata.ip, url: req.url });
            return createErrorResponse('Too many booking requests. Please try again later.', 429);
        }

        // Authentication
        session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            logger.warn('Unauthorized access attempt', { method: 'POST', url: req.url, ip: metadata.ip });
            return createErrorResponse('Unauthorized', 401);
        }
        
        logger.info('Booking create request', { email: session.user.email, method: 'POST', url: req.url });

        await dbConnect();

        // Get user
        const user = await User.findOne({ email: session.user.email }).select('_id name email').lean();
        if (!user) {
            return addSecurityHeaders(createErrorResponse('User not found', 404));
        }

        // Parse and validate request body with enhanced validation
        let body;
        try {
            body = await req.json();
        } catch {
            return createErrorResponse('Invalid JSON in request body', 400);
        }
        
        const {
            propertyId,
            checkInDate,
            durationMonths,
            roomType,
            specialRequests,
            guestCount = 1,
        } = body;

        // Enhanced validation with better error messages
        const validPropertyId = validateObjectId(propertyId);
        if (!validPropertyId) {
            logger.warn('Invalid property ID in booking request', { propertyId, user: session.user.email });
            return createErrorResponse('Invalid property ID format', 400);
        }

        if (!checkInDate) {
            return createErrorResponse('Check-in date is required', 400);
        }

        const checkIn = new Date(checkInDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today
        
        if (isNaN(checkIn.getTime())) {
            return createErrorResponse('Invalid check-in date format', 400);
        }
        
        if (checkIn < now) {
            return createErrorResponse('Check-in date must be today or in the future', 400);
        }

        const validDuration = validateInteger(durationMonths, 1, 12);
        if (!validDuration) {
            return createErrorResponse('Duration must be between 1 and 12 months', 400);
        }
        
        const validGuestCount = validateInteger(guestCount, 1, 4);
        if (!validGuestCount) {
            return createErrorResponse('Guest count must be between 1 and 4', 400);
        }
        
        // Sanitize text inputs
        const sanitizedRoomType = roomType ? sanitizeString(roomType).slice(0, 50) : null;
        const sanitizedRequests = specialRequests ? sanitizeString(specialRequests).slice(0, 500) : null;

        // Get property details with defensive checks
        const property = await Property.findById(validPropertyId)
            .populate('ownerId', '_id name email')
            .lean();

        if (!property) {
            logger.warn('Booking attempt for non-existent property', { 
                propertyId: validPropertyId, 
                user: session.user.email 
            });
            return createErrorResponse('Property not found', 404);
        }
        
        // Defensive checks for property data
        if (!property.liveStats || typeof property.liveStats.occupiedRooms !== 'number' || 
            typeof property.liveStats.totalRooms !== 'number') {
            logger.error('Property missing required liveStats data', { propertyId: validPropertyId });
            return createErrorResponse('Property data incomplete. Please contact support.', 500);
        }

        // Check availability
        if (property.liveStats.occupiedRooms >= property.liveStats.totalRooms) {
            logger.info('Booking attempt for fully occupied property', { 
                propertyId: validPropertyId,
                occupiedRooms: property.liveStats.occupiedRooms,
                totalRooms: property.liveStats.totalRooms
            });
            return createErrorResponse('No rooms available for this property', 400);
        }

        // Prevent booking own property
        if (property.ownerId._id.toString() === user._id.toString()) {
            logger.logSecurity('OWN_PROPERTY_BOOKING_ATTEMPT', {
                email: session.user.email,
                propertyId: validPropertyId
            });
            return createErrorResponse('Cannot book your own property', 400);
        }

        // Check for existing active booking
        const existingBooking = await Booking.findOne({
            studentId: user._id,
            propertyId: validPropertyId,
            status: { $in: ['pending', 'confirmed', 'checked-in'] },
        }).lean();

        if (existingBooking) {
            logger.info('Duplicate booking attempt prevented', { 
                user: session.user.email,
                propertyId: validPropertyId,
                existingBookingId: existingBooking._id
            });
            return createErrorResponse('You already have an active booking for this property', 400);
        }

        // Calculate pricing with defensive checks
        if (!property.price || typeof property.price.amount !== 'number' || property.price.amount <= 0) {
            logger.error('Property has invalid pricing data', { propertyId: validPropertyId });
            return createErrorResponse('Property pricing is not configured correctly', 500);
        }
        
        const monthlyRent = property.price.amount;
        const securityDeposit = monthlyRent; // 1 month security deposit
        const totalAmount = (monthlyRent * validDuration) + securityDeposit;
        
        // Sanity check on total amount
        if (totalAmount > 10000000) { // 1 crore max
            logger.warn('Unusually high booking amount', { 
                totalAmount, 
                propertyId: validPropertyId,
                user: session.user.email
            });
            return createErrorResponse('Booking amount exceeds maximum limit', 400);
        }

        // Create booking with validated and sanitized data
        const booking = await Booking.create({
            studentId: user._id,
            propertyId: validPropertyId,
            ownerId: property.ownerId._id,
            roomType: sanitizedRoomType,
            checkInDate: checkIn,
            durationMonths: validDuration,
            monthlyRent,
            securityDeposit,
            totalAmount,
            amountPaid: totalAmount * 100, // Total amount in paise (₹18,000 = 1,800,000 paise)
            specialRequests: sanitizedRequests,
            guestCount: validGuestCount,
            status: 'pending',
            paymentStatus: 'pending',
            source: 'web',
            metadata: {
                userAgent: metadata.userAgent,
                ip: metadata.ip,
            },
        });

        // Update property occupancy (optimistic)
        await Property.findByIdAndUpdate(validPropertyId, {
            $inc: { 'liveStats.occupiedRooms': 1 },
        });

        // Create audit log
        await createAuditLog({
            userId: user._id.toString(),
            userRole: 'student',
            userEmail: user.email,
            action: 'booking.create',
            resourceType: 'booking',
            resourceId: booking._id.toString(),
            resourceName: `Booking for ${property.title}`,
            after: {
                propertyId: validPropertyId,
                checkInDate: checkIn.toISOString(),
                durationMonths: validDuration,
                totalAmount,
            },
            req,
        });
        
        // Log security event
        logger.logSecurity('BOOKING_CREATED', {
            email: session.user.email,
            bookingId: booking._id.toString(),
            propertyId: validPropertyId,
            totalAmount,
        });

        // Populate for response
        const populatedBooking = await Booking.findById(booking._id)
            .populate('propertyId', 'title slug location media price')
            .populate('ownerId', 'name email')
            .lean();

        const response = NextResponse.json(
            {
                success: true,
                message: 'Booking request created successfully',
                booking: populatedBooking,
                nextStep: 'payment',
                timestamp: new Date().toISOString(),
            },
            { status: 201 }
        );
        
        // Add security and rate limit headers
        addSecurityHeaders(response);
        addRateLimitHeaders(response, 20, rateLimitResult.remaining, rateLimitResult.resetTime);
        
        // Log performance
        const duration = Date.now() - startTime;
        if (duration > 1000) {
            logger.warn('Slow request', { route: 'POST /api/bookings/create', duration });
        }
        
        return response;
        
    } catch (error: any) {
        // Enhanced error logging
        logger.error('Booking creation failed', sanitizeErrorForLog(error), { 
            metadata,
            user: session?.user?.email || 'unknown'
        });
        
        // Handle specific error types
        if (error.code === 11000) {
            return createErrorResponse('A booking with this information already exists', 409);
        }
        
        if (error.name === 'ValidationError') {
            return createErrorResponse('Invalid booking data provided', 400);
        }
        
        // Safe error response (no sensitive data)
        return createErrorResponse(
            'Failed to create booking. Please try again later.',
            500
        );
    }
}
