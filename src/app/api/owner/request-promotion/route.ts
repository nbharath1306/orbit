import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { propertyId, propertyTitle } = await request.json();

    const User = mongoose.model('User');
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If already owner, return error
    if (user.role === 'owner') {
      return NextResponse.json(
        { error: 'User is already an owner' },
        { status: 400 }
      );
    }

    const OwnerPromotionRequest = mongoose.model('OwnerPromotionRequest');

    // Check if already has pending request
    const existingRequest = await OwnerPromotionRequest.findOne({
      userId: user._id,
      status: 'pending',
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending owner promotion request' },
        { status: 400 }
      );
    }

    // Create new promotion request
    const promotionRequest = new OwnerPromotionRequest({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      propertyId,
      propertyTitle,
      status: 'pending',
    });

    await promotionRequest.save();

    return NextResponse.json({
      success: true,
      message: 'Owner promotion request submitted. Waiting for admin approval.',
      promotionRequest,
    });
  } catch (error) {
    console.error('Error requesting owner status:', error);
    return NextResponse.json(
      { error: 'Failed to request owner status' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    const OwnerPromotionRequest = mongoose.model('OwnerPromotionRequest');

    const promotionRequest = await OwnerPromotionRequest.findOne({
      userId: session.user.id,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      promotionRequest,
    });
  } catch (error) {
    console.error('Error fetching promotion request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotion request' },
      { status: 500 }
    );
  }
}
