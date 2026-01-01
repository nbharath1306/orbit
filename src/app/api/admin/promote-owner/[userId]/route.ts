import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { userId } = await context.params;

    const { propertyId, propertyTitle } = await request.json();

    // Find or create promotion request
    const User = mongoose.model('User');
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role to 'owner'
    user.role = 'owner';
    await user.save();

    // Mark promotion request as approved
    const OwnerPromotionRequest = mongoose.model('OwnerPromotionRequest');
    await OwnerPromotionRequest.findOneAndUpdate(
      { userId, status: 'pending' },
      {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      }
    );

    return NextResponse.json({
      success: true,
      message: `${user.name} promoted to owner`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error promoting owner:', error);
    return NextResponse.json(
      { error: 'Failed to promote owner' },
      { status: 500 }
    );
  }
}
