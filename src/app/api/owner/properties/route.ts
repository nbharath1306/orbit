import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userId = (session.user as Record<string, unknown>).id as string;
    const userEmail = (session.user as Record<string, unknown>).email as string;

    // Only owners can access their own properties
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Get the user to find their ID
    const user = await User.findOne({ email: userEmail }).lean();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch properties owned by this user
    const properties = await Property.find({ ownerId: user._id })
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ 
      properties,
      count: properties.length 
    });
  } catch (error) {
    console.error('Error in GET /api/owner/properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as Record<string, unknown>).role as string;
    const userEmail = (session.user as Record<string, unknown>).email as string;

    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Get the user
    const user = await User.findOne({ email: userEmail }).lean();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();

    // Create property with owner ID
    const property = await Property.create({
      ...body,
      ownerId: user._id,
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/owner/properties:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
