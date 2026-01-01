import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { reason } = await request.json();

    const OwnerPromotionRequest = mongoose.model('OwnerPromotionRequest');
    const User = mongoose.model('User');

    const promotionRequest = await OwnerPromotionRequest.findOneAndUpdate(
      { userId, status: 'pending' },
      {
        status: 'rejected',
        reason: reason || 'Rejected by admin',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
      { new: true }
    );

    if (!promotionRequest) {
      return NextResponse.json(
        { error: 'Promotion request not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(userId);

    return NextResponse.json({
      success: true,
      message: `Owner promotion request rejected for ${user.name}`,
      promotionRequest,
    });
  } catch (error) {
    console.error('Error rejecting owner promotion:', error);
    return NextResponse.json(
      { error: 'Failed to reject owner promotion' },
      { status: 500 }
    );
  }
}
