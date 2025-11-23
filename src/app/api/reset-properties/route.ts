import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

export async function GET() {
    try {
        await dbConnect();

        // Delete all properties
        await Property.deleteMany({});

        return NextResponse.json({ message: 'All properties deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete properties', details: error }, { status: 500 });
    }
}
