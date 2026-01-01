import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Property from '@/models/Property';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all properties owned by this user
    const properties = await Property.find({ ownerId: session.user.id }).select('_id');
    const propertyIds = properties.map((p: any) => p._id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        reviews: [],
      });
    }

    // Get reviews for these properties
    const reviews = await Review.find({ propertyId: { $in: propertyIds } })
      .populate('studentId', 'name email')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (error: any) {
    console.error('Error fetching owner reviews:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
