import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';
import { rateLimit, getClientIp, createErrorResponse, addSecurityHeaders, sanitizeInput } from '@/lib/security';
import mongoose from 'mongoose';

// GET single review
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`review-get-${clientIp}`, 60, 60000);

    if (!rateLimitResult.success) {
      return addSecurityHeaders(createErrorResponse('Too many requests', 429));
    }

    await dbConnect();

    const reviewId = id;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return addSecurityHeaders(createErrorResponse('Invalid review ID', 400));
    }

    const review = await Review.findById(reviewId)
      .populate('studentId', 'name image')
      .populate('propertyId', 'title slug location')
      .lean();

    if (!review) {
      return addSecurityHeaders(createErrorResponse('Review not found', 404));
    }

    return addSecurityHeaders(NextResponse.json({ review }));
  } catch (error) {
    console.error('Error fetching review:', error);
    return addSecurityHeaders(createErrorResponse('Failed to fetch review', 500));
  }
}

// PATCH - Update review or add owner response
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`review-update-${clientIp}`, 20, 60000);

    if (!rateLimitResult.success) {
      return addSecurityHeaders(createErrorResponse('Too many requests', 429));
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id role').lean();
    if (!user) {
      return addSecurityHeaders(createErrorResponse('User not found', 404));
    }

    const reviewId = id;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return addSecurityHeaders(createErrorResponse('Invalid review ID', 400));
    }

    const body = await req.json();
    const { action, response, reason } = body;

    const review = await Review.findById(reviewId).populate('propertyId');
    if (!review) {
      return addSecurityHeaders(createErrorResponse('Review not found', 404));
    }

    switch (action) {
      case 'respond':
        // Owner responds to review
        const isOwner = (review.propertyId as any).ownerId.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) {
          return addSecurityHeaders(createErrorResponse('Only property owner can respond', 403));
        }

        if (!response || response.length < 10 || response.length > 1000) {
          return addSecurityHeaders(
            createErrorResponse('Response must be between 10 and 1000 characters', 400)
          );
        }

        review.ownerResponse = {
          comment: sanitizeInput(response),
          respondedAt: new Date(),
        };

        break;

      case 'helpful':
        // Mark review as helpful (any user)
        review.helpfulCount += 1;
        break;

      case 'report':
        // Report review
        review.reportCount += 1;

        // Auto-flag if multiple reports
        if (review.reportCount >= 5 && review.status !== 'flagged') {
          review.status = 'flagged';
        }

        break;

      case 'moderate':
        // Admin moderation
        if (user.role !== 'admin') {
          return addSecurityHeaders(createErrorResponse('Admin access required', 403));
        }

        const newStatus = body.status;
        if (!['approved', 'rejected', 'flagged', 'pending'].includes(newStatus)) {
          return addSecurityHeaders(createErrorResponse('Invalid status', 400));
        }

        review.status = newStatus;
        review.moderationReason = reason;
        review.moderatedBy = user._id;
        review.moderatedAt = new Date();

        break;

      default:
        return addSecurityHeaders(createErrorResponse('Invalid action', 400));
    }

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('studentId', 'name image')
      .populate('propertyId', 'title slug')
      .lean();

    return addSecurityHeaders(
      NextResponse.json({
        message: 'Review updated successfully',
        review: populatedReview,
      })
    );
  } catch (error) {
    console.error('Error updating review:', error);
    return addSecurityHeaders(createErrorResponse('Failed to update review', 500));
  }
}

// DELETE - Delete review (student or admin only)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('_id role').lean();
    if (!user) {
      return addSecurityHeaders(createErrorResponse('User not found', 404));
    }

    const reviewId = id;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return addSecurityHeaders(createErrorResponse('Invalid review ID', 400));
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return addSecurityHeaders(createErrorResponse('Review not found', 404));
    }

    // Only student who wrote the review or admin can delete
    const isAuthor = review.studentId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return addSecurityHeaders(createErrorResponse('Access denied', 403));
    }

    await Review.findByIdAndDelete(reviewId);

    return addSecurityHeaders(
      NextResponse.json({ message: 'Review deleted successfully' })
    );
  } catch (error) {
    console.error('Error deleting review:', error);
    return addSecurityHeaders(createErrorResponse('Failed to delete review', 500));
  }
}
