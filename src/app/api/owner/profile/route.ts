import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Message from '@/models/Message';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import Review from '@/models/Review';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email }).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || user.image || '',
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, address, avatar } = body;

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if new email is already taken by another user
    if (email && email !== session.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    // Update user
    const oldName = user.name;
    const oldEmail = user.email;
    
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.image = avatar || user.image;
    user.avatar = avatar || user.avatar;

    await user.save();

    // Update name across all collections if it changed
    if (name && name !== oldName) {
      try {
        // Update in Messages
        await Message.updateMany(
          { $or: [{ senderId: user._id }, { receiverId: user._id }] },
          { $set: { 'senderName': name } }
        );

        // Update in Bookings (if studentId matches)
        await Booking.updateMany(
          { studentId: user._id },
          { $set: { 'studentId.name': name } }
        );

        // Update in Properties (if ownerId matches)
        await Property.updateMany(
          { ownerId: user._id },
          { $set: { 'owner.name': name } }
        );

        // Update in Reviews
        await Review.updateMany(
          { studentId: user._id },
          { $set: { 'studentId.name': name } }
        );

        console.log('Name updated across all collections');
      } catch (err) {
        console.error('Error updating name across collections:', err);
      }
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
