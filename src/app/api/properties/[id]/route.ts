import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { id } = await params;

    try {
        const property = await Property.findById(id);
        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        // Check ownership
        // @ts-ignore
        if (property.ownerId.toString() !== session.user.id && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (body.occupiedRooms !== undefined) {
            property.liveStats.occupiedRooms = body.occupiedRooms;
        }

        await property.save();
        return NextResponse.json(property);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
    }
}
