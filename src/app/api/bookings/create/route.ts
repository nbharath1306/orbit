import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { propertyId, amountPaid } = body;

    try {
        // Create Booking
        const booking = await Booking.create({
            studentId: session.user.id,
            propertyId,
            status: 'paid', // Mock success
            paymentId: `pay_${Math.random().toString(36).substring(7)}`,
            amountPaid,
        });

        // Optional: Update occupied rooms count automatically?
        // For now, we'll leave it to the owner to manage or do it here.
        // Let's increment it for "Real-time" feel.
        await Property.findByIdAndUpdate(propertyId, {
            $inc: { 'liveStats.occupiedRooms': 1 }
        });

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
