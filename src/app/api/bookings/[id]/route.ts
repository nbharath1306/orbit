import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import User from '@/models/User';
import { rateLimit, getClientIp, createErrorResponse, addSecurityHeaders } from '@/lib/security';
import mongoose from 'mongoose';

// GET single booking details
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`booking-get-${clientIp}`, 60, 60000);

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

    const bookingId = id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return addSecurityHeaders(createErrorResponse('Invalid booking ID', 400));
    }

    const booking = await Booking.findById(bookingId)
      .populate('propertyId', 'title slug location media price amenities')
      .populate('ownerId', 'name email phone')
      .populate('studentId', 'name email phone')
      .lean()
      .exec();

    if (!booking) {
      return addSecurityHeaders(createErrorResponse('Booking not found', 404));
    }

    // Authorization: Only student, owner, or admin can view
    const isAuthorized =
      booking.studentId._id.toString() === user._id.toString() ||
      booking.ownerId._id.toString() === user._id.toString() ||
      user.role === 'admin';

    if (!isAuthorized) {
      return addSecurityHeaders(createErrorResponse('Access denied', 403));
    }

    return addSecurityHeaders(NextResponse.json({ booking }));
  } catch (error) {
    console.error('Error fetching booking:', error);
    return addSecurityHeaders(createErrorResponse('Failed to fetch booking', 500));
  }
}

// PATCH - Update booking (for status changes, cancellation)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = rateLimit(`booking-update-${clientIp}`, 30, 60000);

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

    const bookingId = id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return addSecurityHeaders(createErrorResponse('Invalid booking ID', 400));
    }

    const body = await req.json();
    const { action, reason, message } = body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return addSecurityHeaders(createErrorResponse('Booking not found', 404));
    }

    // Authorization checks
    const isStudent = booking.studentId.toString() === user._id.toString();
    const isOwner = booking.ownerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    switch (action) {
      case 'cancel':
        // Student can cancel pending/confirmed bookings
        if (!isStudent && !isAdmin) {
          return addSecurityHeaders(createErrorResponse('Only student can cancel', 403));
        }

        if (!['pending', 'confirmed'].includes(booking.status)) {
          return addSecurityHeaders(
            createErrorResponse('Cannot cancel booking in current state', 400)
          );
        }

        booking.status = 'cancelled';
        booking.cancelledBy = isStudent ? 'student' : 'admin';
        booking.cancelledAt = new Date();
        booking.cancellationReason = reason || 'Cancelled by user';

        // Calculate refund (example: full refund if >7 days before check-in)
        const daysUntilCheckIn = Math.ceil(
          (new Date(booking.checkInDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilCheckIn > 7 && booking.paymentStatus === 'paid') {
          booking.refundAmount = booking.amountPaid;
          booking.paymentStatus = 'refunded';
        } else if (daysUntilCheckIn > 3) {
          booking.refundAmount = booking.amountPaid * 0.5; // 50% refund
        }

        // Update property occupancy
        await Property.findByIdAndUpdate(booking.propertyId, {
          $inc: { 'liveStats.occupiedRooms': -1 },
        });

        break;

      case 'accept':
        // Owner accepts pending booking
        if (!isOwner && !isAdmin) {
          return addSecurityHeaders(createErrorResponse('Only owner can accept', 403));
        }

        if (booking.status !== 'pending') {
          return addSecurityHeaders(
            createErrorResponse('Can only accept pending bookings', 400)
          );
        }

        booking.status = 'confirmed';
        booking.ownerResponse = {
          status: 'accepted',
          message: message || 'Booking accepted',
          respondedAt: new Date(),
        };

        break;

      case 'reject':
        // Owner rejects pending booking
        if (!isOwner && !isAdmin) {
          return addSecurityHeaders(createErrorResponse('Only owner can reject', 403));
        }

        if (booking.status !== 'pending') {
          return addSecurityHeaders(
            createErrorResponse('Can only reject pending bookings', 400)
          );
        }

        booking.status = 'rejected';
        booking.cancelledBy = 'owner';
        booking.cancelledAt = new Date();
        booking.cancellationReason = reason || 'Rejected by owner';
        booking.ownerResponse = {
          status: 'rejected',
          message: message || 'Booking rejected',
          respondedAt: new Date(),
        };

        // Refund if payment was made
        if (booking.paymentStatus === 'paid') {
          booking.refundAmount = booking.amountPaid;
          booking.paymentStatus = 'refunded';
        }

        // Update property occupancy
        await Property.findByIdAndUpdate(booking.propertyId, {
          $inc: { 'liveStats.occupiedRooms': -1 },
        });

        break;

      case 'checkin':
        // Mark as checked in
        if (!isOwner && !isAdmin) {
          return addSecurityHeaders(createErrorResponse('Only owner can mark check-in', 403));
        }

        if (booking.status !== 'confirmed') {
          return addSecurityHeaders(
            createErrorResponse('Can only check-in confirmed bookings', 400)
          );
        }

        booking.status = 'checked-in';
        break;

      case 'complete':
        // Mark as completed
        if (!isOwner && !isAdmin) {
          return addSecurityHeaders(createErrorResponse('Only owner can complete', 403));
        }

        if (booking.status !== 'checked-in') {
          return addSecurityHeaders(
            createErrorResponse('Can only complete checked-in bookings', 400)
          );
        }

        booking.status = 'completed';
        booking.checkOutDate = new Date();

        // Update property occupancy
        await Property.findByIdAndUpdate(booking.propertyId, {
          $inc: { 'liveStats.occupiedRooms': -1 },
        });

        break;

      default:
        return addSecurityHeaders(createErrorResponse('Invalid action', 400));
    }

    await booking.save();

    return addSecurityHeaders(
      NextResponse.json({
        message: 'Booking updated successfully',
        booking,
      })
    );
  } catch (error) {
    console.error('Error updating booking:', error);
    return addSecurityHeaders(createErrorResponse('Failed to update booking', 500));
  }
}

// DELETE - Admin only
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

    const user = await User.findOne({ email: session.user.email }).select('role').lean();
    if (!user || user.role !== 'admin') {
      return addSecurityHeaders(createErrorResponse('Admin access required', 403));
    }

    const bookingId = id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return addSecurityHeaders(createErrorResponse('Invalid booking ID', 400));
    }

    await Booking.findByIdAndDelete(bookingId);

    return addSecurityHeaders(
      NextResponse.json({ message: 'Booking deleted successfully' })
    );
  } catch (error) {
    console.error('Error deleting booking:', error);
    return addSecurityHeaders(createErrorResponse('Failed to delete booking', 500));
  }
}
