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
} from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`stats-${clientIp}`, 60, 60000); // 60 requests per minute

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

    // Database connection with timeout
    const dbConnectPromise = dbConnect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );

    await Promise.race([dbConnectPromise, timeoutPromise]);

    // Find user with lean query for performance
    const user = await User.findOne({ email: session.user.email })
      .select('_id email name')
      .lean()
      .exec();

    if (!user) {
      return addSecurityHeaders(createErrorResponse('User not found', 404));
    }

    // Parallel execution for better performance
    const [activeBookings, paidBookings, thisMonthBookings] = await Promise.all([
      // Get active bookings count
      Booking.countDocuments({
        studentId: user._id,
        $or: [{ status: 'confirmed' }, { status: 'paid' }],
      }).exec(),

      // Get total spent
      Booking.aggregate([
        {
          $match: {
            studentId: user._id,
            status: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amountPaid' },
          },
        },
      ]).exec(),

      // Get monthly spent
      (async () => {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        return Booking.aggregate([
          {
            $match: {
              studentId: user._id,
              createdAt: { $gte: monthStart },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amountPaid' },
            },
          },
        ]).exec();
      })(),
    ]);

    const response = NextResponse.json({
      activeBookings: activeBookings || 0,
      totalSpent: paidBookings[0]?.total || 0,
      monthlySpent: thisMonthBookings[0]?.total || 0,
      averageRating: 4.8,
      unreadMessages: 0,
      pendingReviews: 0,
      savedProperties: 0,
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '60');
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));

    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching stats:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return addSecurityHeaders(
      createErrorResponse(
        'Failed to fetch statistics',
        500,
        process.env.NODE_ENV === 'development' ? message : undefined
      )
    );
  }
}
