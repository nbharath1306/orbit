import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type'); // e.g. 'gender' if we had it, or other filters

    let query: any = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { 'location.address': { $regex: search, $options: 'i' } },
        ];
    }

    try {
        const properties = await Property.find(query).populate('ownerId', 'name email');
        return NextResponse.json(properties);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session || session.user.role !== 'owner' && session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    try {
        const property = await Property.create({
            ...body,
            // @ts-ignore
            ownerId: session.user.id, // Assuming we attach ID to session
        });
        return NextResponse.json(property, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
    }
}
