import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { rateLimit, getClientIp, createErrorResponse, addSecurityHeaders, sanitizeInput, validatePagination } from '@/lib/security';
import { createAuditLog } from '@/lib/audit';

// GET reviews with filters
export async function GET(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`reviews-get-${clientIp}`, 100, 60000);

    if (!rateLimitResult.success) {
      return addSecurityHeaders(createErrorResponse('Too many requests', 429));
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const studentId = searchParams.get('studentId');
    const minRating = searchParams.get('minRating');
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const limitRaw = parseInt(searchParams.get('limit') || '10');
    const skipRaw = parseInt(searchParams.get('skip') || '0');
    
    const { limit, skip } = validatePagination(limitRaw, skipRaw);

    // Build query
    const query: Record<string, any> = { status: 'approved' };

    if (propertyId) {
      query.propertyId = propertyId;
    }

    if (studentId) {
      query.studentId = studentId;
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (verifiedOnly) {
      query.isVerifiedStay = true;
    }

    // Execute queries
    const [reviews, total, avgRating] = await Promise.all([
      Review.find(query)
        .populate('studentId', 'name image')
        .populate('propertyId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Review.countDocuments(query).exec(),
      Review.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            avgCleanliness: { $avg: '$cleanliness' },
            avgCommunication: { $avg: '$communication' },
            avgAccuracy: { $avg: '$accuracy' },
            avgLocation: { $avg: '$location' },
            avgValue: { $avg: '$value' },
          },
        },
      ]).exec(),
    ]);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: query },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]).exec();

    const response = NextResponse.json({
      reviews,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
      averages: avgRating[0] || {
        avgRating: 0,
        avgCleanliness: 0,
        avgCommunication: 0,
        avgAccuracy: 0,
        avgLocation: 0,
        avgValue: 0,
      },
      ratingDistribution: ratingDistribution.reduce(
        (acc: Record<string, number>, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        },
        {}
      ),
    });

    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return addSecurityHeaders(createErrorResponse('Failed to fetch reviews', 500));
  }
}

// POST - Create new review
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`review-create-${clientIp}`, 10, 60000); // 10 reviews per minute

    if (!rateLimitResult.success) {
      return addSecurityHeaders(createErrorResponse('Too many requests', 429));
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id').lean();
    if (!user) {
      return addSecurityHeaders(createErrorResponse('User not found', 404));
    }

    const body = await req.json();
    const {
      propertyId,
      bookingId,
      rating,
      cleanliness,
      communication,
      accuracy,
      location,
      value,
      comment,
      title,
      pros,
      cons,
      images,
      isAnonymous = false,
    } = body;

    // Validation
    if (!propertyId) {
      return addSecurityHeaders(createErrorResponse('Property ID is required', 400));
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return addSecurityHeaders(createErrorResponse('Property not found', 404));
    }

    // Validate ratings (1-5)
    const ratings = { rating, cleanliness, communication, accuracy, location, value };
    for (const [key, val] of Object.entries(ratings)) {
      if (!val || val < 1 || val > 5) {
        return addSecurityHeaders(
          createErrorResponse(`${key} must be between 1 and 5`, 400)
        );
      }
    }

    // Validate comment
    if (!comment || comment.length < 50 || comment.length > 2000) {
      return addSecurityHeaders(
        createErrorResponse('Comment must be between 50 and 2000 characters', 400)
      );
    }

    // Check if user has a completed booking (for verified stay)
    let isVerifiedStay = false;
    let stayDuration = 0;

    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking && booking.studentId.toString() === user._id.toString()) {
        isVerifiedStay = ['completed', 'checked-in'].includes(booking.status);
        stayDuration = booking.durationMonths;

        // Check if review already exists for this booking
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
          return addSecurityHeaders(
            createErrorResponse('Review already submitted for this booking', 400)
          );
        }
      }
    }

    // Check for duplicate reviews from same user for same property
    if (!bookingId) {
      const existingReview = await Review.findOne({
        studentId: user._id,
        propertyId,
      });

      if (existingReview) {
        return addSecurityHeaders(
          createErrorResponse('You have already reviewed this property', 400)
        );
      }
    }

    // Create review
    const review = await Review.create({
      studentId: user._id,
      propertyId,
      bookingId: bookingId || undefined,
      rating: Math.round(rating),
      cleanliness: Math.round(cleanliness),
      communication: Math.round(communication),
      accuracy: Math.round(accuracy),
      location: Math.round(location),
      value: Math.round(value),
      comment: sanitizeInput(comment),
      title: title ? sanitizeInput(title.substring(0, 100)) : undefined,
      pros: pros?.map((p: string) => sanitizeInput(p.substring(0, 200))),
      cons: cons?.map((c: string) => sanitizeInput(c.substring(0, 200))),
      images: images?.slice(0, 5), // Max 5 images
      isAnonymous,
      isVerifiedStay,
      stayDuration,
      status: 'approved', // Auto-approve for now; add moderation later
    });

    // Update property's average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { propertyId: property._id, status: 'approved' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          avgCleanliness: { $avg: '$cleanliness' },
          avgCommunication: { $avg: '$communication' },
          avgAccuracy: { $avg: '$accuracy' },
          avgLocation: { $avg: '$location' },
          avgValue: { $avg: '$value' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (avgRatingResult.length > 0) {
      const avgData = avgRatingResult[0];
      await Property.findByIdAndUpdate(propertyId, {
        averageRating: Math.round(avgData.avgRating * 10) / 10,
        avgCleanliness: Math.round(avgData.avgCleanliness * 10) / 10,
        avgCommunication: Math.round(avgData.avgCommunication * 10) / 10,
        avgAccuracy: Math.round(avgData.avgAccuracy * 10) / 10,
        avgLocation: Math.round(avgData.avgLocation * 10) / 10,
        avgValue: Math.round(avgData.avgValue * 10) / 10,
        reviewCount: avgData.reviewCount,
      });
    }

    const populatedReview = await Review.findById(review._id)
      .populate('studentId', 'name image')
      .populate('propertyId', 'title slug')
      .lean();

    // Create audit log
    await createAuditLog({
      userId: user._id.toString(),
      userRole: 'student',
      userEmail: session.user.email,
      action: 'review.create',
      resourceType: 'review',
      resourceId: review._id.toString(),
      resourceName: `Review for ${property.title}`,
      after: {
        rating,
        cleanliness,
        communication,
        accuracy,
        location,
        value,
        propertyId,
      },
      req,
    });

    return addSecurityHeaders(
      NextResponse.json(
        {
          message: 'Review submitted successfully',
          review: populatedReview,
        },
        { status: 201 }
      )
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return addSecurityHeaders(createErrorResponse('Failed to create review', 500));
  }
}
