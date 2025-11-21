import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Property from '@/models/Property';

export async function GET() {
    await dbConnect();

    try {
        // 1. Create an Owner
        let owner = await User.findOne({ email: 'owner@orbit.com' });
        if (!owner) {
            owner = await User.create({
                name: 'Orbit Owner',
                email: 'owner@orbit.com',
                role: 'owner',
                isVerified: true,
                phone: '9999999999',
            });
        }

        // 2. Create Properties
        const properties = [
            {
                ownerId: owner!._id,
                title: 'Sai Balaji PG',
                slug: 'sai-balaji-pg',
                description: 'Premium PG for students near DSU. Includes 3 times food and WiFi.',
                location: {
                    lat: 12.644,
                    lng: 77.436,
                    address: 'Harohalli, Karnataka',
                    directionsVideoUrl: 'https://youtube.com/shorts/example',
                },
                price: { amount: 6500, period: 'monthly' },
                amenities: ['WiFi', 'Mess', 'Hot Water', 'CCTV'],
                media: {
                    images: ['https://placehold.co/600x400/09090b/3b82f6?text=Sai+Balaji'],
                    virtualTourUrl: 'https://kuula.co/share/collection/7lVLq', // Example
                },
                liveStats: { totalRooms: 50, occupiedRooms: 42 },
                verdict: 'Best food in Harohalli. Highly recommended for DSU students.',
                sentimentTags: ['Good Food', 'Strict Warden', 'Walkable to Campus'],
            },
            {
                ownerId: owner!._id,
                title: 'DSU Hostels',
                slug: 'dsu-hostels',
                description: 'Official on-campus accommodation. Very secure but strict rules.',
                location: {
                    lat: 12.642,
                    lng: 77.438,
                    address: 'DSU Campus, Harohalli',
                },
                price: { amount: 9000, period: 'monthly' },
                amenities: ['WiFi', 'Gym', 'Library Access', '24/7 Power'],
                media: {
                    images: ['https://placehold.co/600x400/09090b/3b82f6?text=DSU+Hostel'],
                },
                liveStats: { totalRooms: 200, occupiedRooms: 180 },
                verdict: 'Safest option but expensive. Curfew is strict.',
                sentimentTags: ['Safe', 'On Campus', 'Expensive'],
            },
            {
                ownerId: owner!._id,
                title: 'Green View Residency',
                slug: 'green-view',
                description: 'Budget friendly rooms with a nice view of the hills.',
                location: {
                    lat: 12.646,
                    lng: 77.434,
                    address: 'Near Bus Stand, Harohalli',
                },
                price: { amount: 4500, period: 'monthly' },
                amenities: ['WiFi', 'Parking', 'No Mess'],
                media: {
                    images: ['https://placehold.co/600x400/09090b/3b82f6?text=Green+View'],
                },
                liveStats: { totalRooms: 20, occupiedRooms: 5 },
                verdict: 'Good for budget. You need to arrange your own food.',
                sentimentTags: ['Budget', 'Freedom', 'No Food'],
            },
        ];

        for (const prop of properties) {
            const exists = await Property.findOne({ slug: prop.slug });
            if (!exists) {
                await Property.create(prop);
            }
        }

        return NextResponse.json({ message: 'Database seeded successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to seed database', details: error }, { status: 500 });
    }
}
