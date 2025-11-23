import mongoose from 'mongoose';
import User from '../models/User';
import Property from '../models/Property';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orbit';

async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    try {
        // 1. Create an Owner
        let owner = await User.findOne({ email: 'owner@orbit.com' });
        if (!owner) {
            console.log('Creating Owner...');
            owner = await User.create({
                name: 'Orbit Owner',
                email: 'owner@orbit.com',
                role: 'owner',
                isVerified: true,
                phone: '9999999999',
            });
        } else {
            console.log('Owner already exists.');
        }

        // 2. Create Properties
        const properties = [
            {
                ownerId: owner!._id,
                title: 'Sai Balaji PG',
                slug: 'sai-balaji-pg',
                description: 'Experience premium student living just minutes from DSU campus. Our facility offers a perfect blend of comfort, community, and convenience. With 24/7 security, nutritious home-cooked meals three times a day, and high-speed WiFi, you can focus entirely on your studies while we take care of everything else. The property features spacious rooms, modern amenities, and a friendly atmosphere that makes it feel like home. Our dedicated staff ensures cleanliness and maintenance, while the strict but fair rules create a safe and productive environment for serious students.',
                location: {
                    lat: 12.644,
                    lng: 77.436,
                    address: 'Behind SBI Bank, Harohalli Main Road, Karnataka 562112',
                    directionsVideoUrl: 'https://youtube.com/shorts/dQw4w9WgXcQ',
                },
                price: { amount: 6500, period: 'monthly' },
                amenities: ['High-Speed WiFi', '3 Times Food', '24/7 Hot Water', 'CCTV Security', 'Power Backup', 'Daily Housekeeping', 'Laundry Service', 'Study Room'],
                media: {
                    images: [
                        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
                        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                        'https://images.unsplash.com/photo-1522771753037-6333d7911961?ixlib=rb-4.0.3&auto=format&fit=crop&w=2051&q=80',
                        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
                    ],
                    virtualTourUrl: 'https://kuula.co/share/collection/7lVLq',
                },
                liveStats: { totalRooms: 50, occupiedRooms: 42 },
                verdict: 'Best food quality in Harohalli area. Highly recommended for DSU students who value good meals and a structured environment.',
                sentimentTags: ['Excellent Food', 'Strict Warden', 'Walkable to Campus'],
            },
            {
                ownerId: owner!._id,
                title: 'DSU Hostels',
                slug: 'dsu-hostels',
                description: 'Official on-campus accommodation for DSU students. Experience the ultimate convenience of living right on campus - just a 2-minute walk to your classes, library, and all university facilities. Our hostels provide a safe, secure, and vibrant community environment with modern amenities including a well-equipped gym, 24/7 library access, and nutritious mess food. While the rules are strict and curfew timings are enforced, this ensures a disciplined atmosphere perfect for focused academic pursuits. The hostel also features common rooms for socializing, sports facilities, and regular cultural events that make campus life memorable.',
                location: {
                    lat: 12.642,
                    lng: 77.438,
                    address: 'DSU Campus, Block C, Harohalli, Karnataka 562112',
                    directionsVideoUrl: 'https://youtube.com/shorts/dQw4w9WgXcQ',
                },
                price: { amount: 9000, period: 'monthly' },
                amenities: ['High-Speed WiFi', 'Gym Access', 'Library 24/7', 'Mess Food', '24/7 Power Backup', 'CCTV Security', 'Sports Facilities', 'Common Rooms'],
                media: {
                    images: [
                        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
                        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                        'https://images.unsplash.com/photo-1540518614846-7eded433c457?ixlib=rb-4.0.3&auto=format&fit=crop&w=2057&q=80'
                    ],
                    virtualTourUrl: 'https://kuula.co/share/collection/7lVLq',
                },
                liveStats: { totalRooms: 200, occupiedRooms: 185 },
                verdict: 'Most convenient option with zero commute time. Perfect for students who want to be at the heart of campus life and activities.',
                sentimentTags: ['On Campus', 'Secure', 'Great Social Life'],
            },
            {
                ownerId: owner!._id,
                title: 'Green View Residency',
                slug: 'green-view',
                description: 'A budget-friendly accommodation option that doesn\'t compromise on essentials. Located strategically near the bus stand, Green View Residency offers excellent connectivity for students who need to travel. The property features basic but comfortable rooms with a relaxed, no-curfew policy that gives you the freedom to manage your own schedule. While there\'s no mess facility, the nearby eateries and the option to cook in the common kitchen make meal arrangements flexible and affordable. The friendly community vibe and affordable pricing make this an excellent choice for independent students and seniors who value freedom and budget-consciousness.',
                location: {
                    lat: 12.646,
                    lng: 77.434,
                    address: 'Near KSRTC Bus Stand, Harohalli Main Road, Karnataka 562112',
                    directionsVideoUrl: 'https://youtube.com/shorts/dQw4w9WgXcQ',
                },
                price: { amount: 4500, period: 'monthly' },
                amenities: ['WiFi', 'Bike Parking', 'Basic Furniture', 'Water Supply 24/7', 'Security Guard', 'Common Kitchen'],
                media: {
                    images: [
                        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
                        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
                        'https://images.unsplash.com/photo-1522771753037-6333d7911961?ixlib=rb-4.0.3&auto=format&fit=crop&w=2051&q=80',
                        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
                    ],
                    virtualTourUrl: 'https://kuula.co/share/collection/7lVLq',
                },
                liveStats: { totalRooms: 30, occupiedRooms: 25 },
                verdict: 'Best budget option in the area. Perfect for independent students and seniors who want freedom to manage their own lifestyle.',
                sentimentTags: ['Budget Friendly', 'No Curfew', 'Independent Living'],
            },
        ];

        for (const prop of properties) {
            console.log(`Upserting ${prop.title}...`);
            await Property.updateOne(
                { slug: prop.slug },
                { $set: prop },
                { upsert: true }
            );
        }

        console.log('Seeding complete.');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
