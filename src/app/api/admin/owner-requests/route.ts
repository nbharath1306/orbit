import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const OwnerPromotionRequest = mongoose.model('OwnerPromotionRequest');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const requests = await OwnerPromotionRequest.find({ status })
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ requestedAt: -1 });

    return NextResponse.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Error fetching owner promotion requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owner promotion requests' },
      { status: 500 }
    );
  }
}
