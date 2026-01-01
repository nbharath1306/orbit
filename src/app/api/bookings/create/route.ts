import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { rateLimit, getClientIp, createErrorResponse, addSecurityHeaders } from '@/lib/security';
import { createAuditLog } from '@/lib/audit';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const clientIp = getClientIp(req);
        const rateLimitResult = rateLimit(`booking-create-${clientIp}`, 20, 60000); // 20 bookings per minute

        if (!rateLimitResult.success) {
            return addSecurityHeaders(createErrorResponse('Too many requests', 429));
        }

        // Authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return addSecurityHeaders(createErrorResponse('Unauthorized', 401));
        }

        await dbConnect();

        // Get user
        const user = await User.findOne({ email: session.user.email }).select('_id name email').lean();
        if (!user) {
            return addSecurityHeaders(createErrorResponse('User not found', 404));
        }

        // Parse and validate request body
        const body = await req.json();
        const {
            propertyId,
            checkInDate,
            durationMonths,
            roomType,
            specialRequests,
            guestCount = 1,
        } = body;

        // Validation
        if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
            return addSecurityHeaders(createErrorResponse('Invalid property ID', 400));
        }

        if (!checkInDate) {
            return addSecurityHeaders(createErrorResponse('Check-in date is required', 400));
        }

        const checkIn = new Date(checkInDate);
        if (isNaN(checkIn.getTime()) || checkIn < new Date()) {
            return addSecurityHeaders(
                createErrorResponse('Check-in date must be in the future', 400)
            );
        }

        if (!durationMonths || durationMonths < 1 || durationMonths > 12) {
            return addSecurityHeaders(
                createErrorResponse('Duration must be between 1 and 12 months', 400)
            );
        }

        // Get property details
        const property = await Property.findById(propertyId)
            .populate('ownerId', '_id name email')
            .lean();

        if (!property) {
            return addSecurityHeaders(createErrorResponse('Property not found', 404));
        }

        // Check availability
        if (property.liveStats.occupiedRooms >= property.liveStats.totalRooms) {
            return addSecurityHeaders(createErrorResponse('No rooms available', 400));
        }

        // Prevent booking own property
        if (property.ownerId._id.toString() === user._id.toString()) {
            return addSecurityHeaders(createErrorResponse('Cannot book your own property', 400));
        }

        // Check for existing active booking
        const existingBooking = await Booking.findOne({
            studentId: user._id,
            propertyId,
            status: { $in: ['pending', 'confirmed', 'checked-in'] },
        });

        if (existingBooking) {
            return addSecurityHeaders(
                createErrorResponse('You already have an active booking for this property', 400)
            );
        }

        // Calculate pricing
        const monthlyRent = property.price.amount;
        const securityDeposit = monthlyRent; // 1 month security deposit
        const totalAmount = (monthlyRent * durationMonths) + securityDeposit;

        // Create booking
        const booking = await Booking.create({
            studentId: user._id,
            propertyId,
            ownerId: property.ownerId._id,
            roomType,
            checkInDate: checkIn,
            durationMonths,
            monthlyRent,
            securityDeposit,
            totalAmount,
            amountPaid: totalAmount * 100, // Total amount in paise (₹18,000 = 1,800,000 paise)
            specialRequests: specialRequests?.substring(0, 500),
            guestCount: Math.max(1, Math.min(guestCount, 4)), // Limit 1-4 guests
            status: 'pending',
            paymentStatus: 'pending',
            source: 'web',
            metadata: {
                userAgent: req.headers.get('user-agent'),
                ip: clientIp,
            },
        });

        // Update property occupancy (optimistic)
        await Property.findByIdAndUpdate(propertyId, {
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
                propertyId,
                checkInDate: checkIn.toISOString(),
                durationMonths,
                totalAmount,
            },
            req,
        });

        // Populate for response
        const populatedBooking = await Booking.findById(booking._id)
            .populate('propertyId', 'title slug location media price')
            .populate('ownerId', 'name email')
            .lean();

        return addSecurityHeaders(
            NextResponse.json(
                {
                    message: 'Booking request created successfully',
                    booking: populatedBooking,
                    nextStep: 'payment',
                },
                { status: 201 }
            )
        );
    } catch (error) {
        console.error('Error creating booking:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return addSecurityHeaders(
            createErrorResponse(
                'Failed to create booking',
                500,
                process.env.NODE_ENV === 'development' ? message : undefined
            )
        );
    }
}
