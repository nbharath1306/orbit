import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import AuditLog from '@/models/AuditLog';
import Message from '@/models/Message';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { 
  rateLimit, 
  getRateLimitIdentifier,
  addSecurityHeaders,
  createErrorResponse,
  validateObjectId,
  sanitizeString,
  getRequestMetadata,
  sanitizeErrorForLog
} from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const metadata = getRequestMetadata(req);
  
  try {
    // Rate limiting - 30 rejects per 15 minutes
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 30, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', { ip: metadata.ip, url: req.url });
      return createErrorResponse('Too many booking actions. Please try again later.', 429);
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logger.warn('Unauthorized access attempt', { method: 'POST', url: req.url, ip: metadata.ip });
      return createErrorResponse('Unauthorized', 401);
    }
    
    logger.info('Booking reject request', { email: session.user.email, method: 'POST', url: req.url });

    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const { bookingId, reason } = body;
    const validBookingId = validateObjectId(bookingId);

    if (!validBookingId) {
      logger.warn('Invalid booking ID in reject request', { bookingId, owner: session.user.email });
      return createErrorResponse('Invalid booking ID format', 400);
    }
    
    // Sanitize rejection reason
    const sanitizedReason = reason ? sanitizeString(reason).slice(0, 500) : 'Owner declined';

    await dbConnect();

    const booking = await Booking.findById(validBookingId).populate('propertyId').lean();

    if (!booking) {
      logger.warn('Reject attempt for non-existent booking', { 
        bookingId: validBookingId, 
        owner: session.user.email 
      });
      return createErrorResponse('Booking not found', 404);
    }

    // Verify user is the owner of this property
    const property = booking.propertyId as any;
    if (!property?.ownerId) {
      logger.error('Booking has invalid property data', { bookingId: validBookingId });
      return createErrorResponse('Invalid booking data', 500);
    }

    if (property.ownerId.toString() !== session.user.id) {
      logger.logSecurity('UNAUTHORIZED_BOOKING_REJECT_ATTEMPT', {
        email: session.user.email,
        bookingId: validBookingId,
        propertyOwnerId: property.ownerId.toString()
      });
      return createErrorResponse('You can only reject bookings for your properties', 403);
    }

    // Can only reject pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      logger.info('Invalid booking status for reject', { 
        bookingId: validBookingId, 
        status: booking.status 
      });
      return createErrorResponse(`Cannot reject ${booking.status} booking`, 400);
    }

    const oldStatus = booking.status;
    
    // Update booking (need to fetch mutable version)
    const updateResult = await Booking.findByIdAndUpdate(
      validBookingId,
      {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: new mongoose.Types.ObjectId(session.user.id),
        rejectionReason: sanitizedReason,
      },
      { new: true }
    );

    if (!updateResult) {
      logger.error('Failed to update booking status', { bookingId: validBookingId });
      return createErrorResponse('Failed to reject booking', 500);
    }

    // Create audit log
    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      action: 'BOOKING_REJECTED',
      entityType: 'Booking',
      entityId: validBookingId,
      status: 'success',
      changes: {
        before: { status: oldStatus },
        after: { status: 'rejected', reason: sanitizedReason },
      },
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      timestamp: new Date(),
    });

    // Send notification message to student
    try {
      const studentId = typeof booking.studentId === 'object' && booking.studentId !== null 
        ? (booking.studentId as any)._id 
        : booking.studentId;
      
      const rejectionMessage = sanitizedReason && sanitizedReason !== 'Owner declined'
        ? `We're sorry, but your booking request for ${property.title} has been declined. Reason: ${sanitizedReason}`
        : `We're sorry, but your booking request for ${property.title} has been declined by the owner.`;
      
      await Message.create({
        threadId: validBookingId.toString(),
        studentId: new mongoose.Types.ObjectId(studentId),
        ownerId: new mongoose.Types.ObjectId(session.user.id),
        senderRole: 'owner',
        message: `❌ ${rejectionMessage}`,
        read: false,
        delivered: false,
      });
    } catch (msgError) {
      logger.warn('Failed to send notification message', { bookingId: validBookingId, error: msgError });
    }
    
    logger.logSecurity('BOOKING_REJECTED', {
      email: session.user.email,
      bookingId: validBookingId,
      previousStatus: oldStatus,
      reason: sanitizedReason
    });

    const response = NextResponse.json({
      success: true,
      message: 'Booking rejected',
      booking: {
        _id: updateResult._id.toString(),
        status: updateResult.status,
      },
      timestamp: new Date().toISOString(),
    });
    
    addSecurityHeaders(response);
    
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow request', { route: 'POST /api/owner/bookings/reject', duration });
    }
    
    return response;
    
  } catch (error: any) {
    logger.error('Booking reject failed', sanitizeErrorForLog(error), { 
      metadata,
      owner: session?.user?.email 
    });

    return createErrorResponse(
      'Failed to reject booking. Please try again later.',
      500
    );
  }
}
