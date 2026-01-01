import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import { createErrorResponse, addSecurityHeaders } from '@/lib/security';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const propertyId = req.nextUrl.searchParams.get('propertyId');

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return addSecurityHeaders(createErrorResponse('Invalid property ID', 400));
    }

    await dbConnect();

    // Get property
    const property = await Property.findById(propertyId).select('liveStats').lean();
    if (!property) {
      return addSecurityHeaders(createErrorResponse('Property not found', 404));
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
    const roomTypeCountMap = new Map();
    bookingsByRoomType.forEach((item) => {
      roomTypeCountMap.set(item._id, item.count);
    });

    // Define room type limits (you can adjust these based on your business logic)
    // For now, assume each room type can have max occupancy limits
    const roomTypeAvailability = {
      single: {
        total: Math.ceil(property.liveStats.totalRooms * 0.3), // 30% single rooms
        booked: roomTypeCountMap.get('single') || 0,
      },
      double: {
        total: Math.ceil(property.liveStats.totalRooms * 0.3), // 30% double rooms
        booked: roomTypeCountMap.get('double') || 0,
      },
      triple: {
        total: Math.ceil(property.liveStats.totalRooms * 0.25), // 25% triple rooms
        booked: roomTypeCountMap.get('triple') || 0,
      },
      quad: {
        total: Math.ceil(property.liveStats.totalRooms * 0.15), // 15% quad rooms
        booked: roomTypeCountMap.get('quad') || 0,
      },
    };

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        availability: roomTypeAvailability,
      })
    );
  } catch (error) {
    console.error('Availability check error:', error);
    return addSecurityHeaders(
      createErrorResponse('Failed to check availability', 500)
    );
  }
}
