import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'pending'; // pending, confirmed, paid, all

    await dbConnect();

    // Get all properties owned by this user
    const Property = require('@/models/Property').default;
    const properties = await Property.find({ ownerId: session.user.id }).select(
      '_id'
    );
    const propertyIds = properties.map((p: any) => p._id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        bookings: [],
      });
    }

    // Build query based on filter
    let query: any = {
      propertyId: { $in: propertyIds },
    };

    if (filter !== 'all') {
      query.status = filter;
    }

    const bookings = await Booking.find(query)
      .populate('studentId', 'name email image')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error: any) {
    console.error('Error fetching owner bookings:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
