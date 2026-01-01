import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as Record<string, unknown>).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { approvalStatus } = await request.json();

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return NextResponse.json(
        { error: 'Invalid approval status' },
        { status: 400 }
      );
    }

    await dbConnect();

    const property = await Property.findByIdAndUpdate(
      id,
      { approvalStatus },
      { new: true }
    );

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // If property is approved, create owner promotion request
    if (approvalStatus === 'approved') {
      const User = mongoose.model('User');
      const OwnerPromotionRequest = mongoose.model('OwnerPromotionRequest');

      const owner = await User.findById(property.ownerId);

      if (owner && owner.role !== 'owner') {
        // Check if already has pending request
        const existingRequest = await OwnerPromotionRequest.findOne({
          userId: owner._id,
          status: 'pending',
        });

        // Create promotion request if not exists
        if (!existingRequest) {
          const promotionRequest = new OwnerPromotionRequest({
            userId: owner._id,
            userEmail: owner.email,
            userName: owner.name,
            propertyId: property._id,
            propertyTitle: property.title,
            status: 'pending',
          });
          await promotionRequest.save();
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      property 
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/properties/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}
