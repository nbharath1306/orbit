import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Booking from '@/models/Booking';
import {
  rateLimit,
  getClientIp,
  createErrorResponse,
  addSecurityHeaders,
  isValidObjectId,
} from '@/lib/security';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`booking-detail-${clientIp}`, 100, 60000);

    if (!rateLimitResult.success) {
      const response = createErrorResponse('Too many requests', 429);
      response.headers.set('Retry-After', String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)));
      return addSecurityHeaders(response);
    }

    // Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      return addSecurityHeaders(createErrorResponse('Invalid booking ID format', 400));
    }

    // Database connection
    await dbConnect();

    // Find user
    const user = await User.findOne({ email: session.user.email })
      .select('_id')
      .lean()
      .exec();

    if (!user) {
      return addSecurityHeaders(createErrorResponse('User not found', 404));
    }

    // Find booking with ownership check
    const booking = await Booking.findOne({
      _id: id,
      studentId: user._id, // Ensure user owns this booking
    })
      .populate('propertyId', 'title slug location images amenities pricing rooms')
      .populate('ownerId', 'name email phone image isVerified')
      .lean()
      .exec();

    if (!booking) {
      return addSecurityHeaders(
        createErrorResponse('Booking not found or access denied', 404)
      );
    }

    const response = NextResponse.json(booking);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));

    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching booking:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return addSecurityHeaders(
      createErrorResponse(
        'Failed to fetch booking details',
        500,
        process.env.NODE_ENV === 'development' ? message : undefined
      )
    );
  }
}
