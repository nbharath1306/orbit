import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Check, Shield, Star, User, Share2, Heart } from 'lucide-react';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import { BookingButton } from '@/components/BookingButton';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Button } from '@/components/ui/button';

// Mock Data for fallback since DB is down
const MOCK_PROPERTY = {
    _id: 'mock-id',
    title: 'Sai Balaji PG',
    slug: 'sai-balaji-pg',
    description: 'Experience premium student living just minutes from DSU. Our facility offers a perfect blend of comfort, community, and convenience. With 24/7 security, nutritious home-cooked meals, and high-speed WiFi, you can focus on your studies while we take care of the rest.',
    location: {
        lat: 12.644,
        lng: 77.436,
        address: 'Harohalli, Karnataka',
        directionsVideoUrl: 'https://youtube.com/shorts/example',
    },
    price: { amount: 6500, period: 'monthly' },
    amenities: ['High-Speed WiFi', '3 Times Food', '24/7 Hot Water', 'CCTV Security', 'Power Backup', 'Daily Housekeeping'],
    media: {
        images: [
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            'https://images.unsplash.com/photo-1522771753037-6333d7911961?ixlib=rb-4.0.3&auto=format&fit=crop&w=2051&q=80'
        ],
        virtualTourUrl: 'https://kuula.co/share/collection/7lVLq',
    },
    liveStats: { totalRooms: 50, occupiedRooms: 42 },
    verdict: 'Best food in Harohalli. Highly recommended for DSU students.',
    sentimentTags: ['Good Food', 'Strict Warden', 'Walkable to Campus'],
    ownerId: { name: 'Orbit Owner' }
};

async function getProperty(slug: string) {
    try {
        await dbConnect();
        const property = await Property.findOne({ slug }).populate('ownerId', 'name').lean();
        return property || MOCK_PROPERTY; // Fallback to mock
    } catch (e) {
        console.error("DB Error, using mock", e);
        return MOCK_PROPERTY;
    }
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const property = await getProperty(slug);

    if (!property) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-20">
            {/* Immersive Header Image */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                <img
                    src={property.media.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 z-20 container mx-auto px-4 pb-12">
                    <ScrollReveal>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {property.sentimentTags.map((tag: string) => (
                                <Badge key={tag} className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 px-3 py-1 text-sm">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{property.title}</h1>
                        <div className="flex items-center text-zinc-300 text-lg">
                            <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                            {property.location.address}
                        </div>
                    </ScrollReveal>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-30">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Media Gallery */}
                        <ScrollReveal delay={0.2}>
                            <Tabs defaultValue="photos" className="w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <TabsList className="bg-zinc-900 border border-zinc-800">
                                        <TabsTrigger value="photos">Photos</TabsTrigger>
                                        <TabsTrigger value="360">360° Tour</TabsTrigger>
                                        <TabsTrigger value="video">Video</TabsTrigger>
                                    </TabsList>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" className="rounded-full border-zinc-700 hover:bg-zinc-800">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="rounded-full border-zinc-700 hover:bg-zinc-800">
                                            <Heart className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <TabsContent value="photos" className="mt-0">
                                    <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden aspect-video">
                                        <img src={property.media.images[0]} className="w-full h-full object-cover" />
                                        <div className="grid grid-rows-2 gap-2">
                                            <img src={property.media.images[1] || property.media.images[0]} className="w-full h-full object-cover" />
                                            <img src={property.media.images[2] || property.media.images[0]} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="360" className="mt-0">
                                    <div className="aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                        {property.media.virtualTourUrl ? (
                                            <iframe
                                                src={property.media.virtualTourUrl}
                                                className="w-full h-full border-0"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <div className="text-zinc-500">No 360° Tour available</div>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent value="video" className="mt-0">
                                    <div className="aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                        <div className="text-zinc-500">Video Player Placeholder</div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </ScrollReveal>

                        {/* About & Amenities */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <ScrollReveal delay={0.3}>
                                <h3 className="text-2xl font-bold mb-6 text-white">About the Space</h3>
                                <p className="text-zinc-400 leading-relaxed text-lg">
                                    {property.description}
                                </p>
                            </ScrollReveal>
                            <ScrollReveal delay={0.4}>
                                <h3 className="text-2xl font-bold mb-6 text-white">Amenities</h3>
                                <ul className="space-y-4">
                                    {property.amenities.map((amenity: string) => (
                                        <li key={amenity} className="flex items-center text-zinc-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center mr-3">
                                                <Check className="h-4 w-4 text-green-500" />
                                            </div>
                                            {amenity}
                                        </li>
                                    ))}
                                </ul>
                            </ScrollReveal>
                        </div>

                        {/* Reviews */}
                        <ScrollReveal delay={0.5}>
                            <div className="border-t border-zinc-800 pt-12">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold text-white">Student Reviews</h3>
                                    <Button variant="outline" className="rounded-full">Write a Review</Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                        A
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">Anonymous Student</div>
                                                        <div className="text-xs text-zinc-500">Verified Resident</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                                    <Star className="h-3 w-3 fill-current" />
                                                    <span className="ml-1 text-sm font-bold">4.0</span>
                                                </div>
                                            </div>
                                            <p className="text-zinc-400 leading-relaxed">
                                                &quot;Great place, food is decent. Internet is fast enough for assignments. The warden is a bit strict about timings though.&quot;
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Right Column: Sticky Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <ScrollReveal delay={0.6}>
                                {/* Verdict Box */}
                                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold">
                                        <Shield className="h-5 w-5" />
                                        Circle13 Verdict
                                    </div>
                                    <p className="text-zinc-300 text-sm italic leading-relaxed">
                                        &quot;{property.verdict || 'Verified by our team. Safe and recommended.'}&quot;
                                    </p>
                                </div>

                                {/* Booking Card */}
                                <Card className="bg-zinc-900 border-zinc-800 shadow-xl shadow-black/50 overflow-hidden">
                                    <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-purple-600" />
                                    <CardContent className="p-8">
                                        <div className="flex justify-between items-baseline mb-8">
                                            <div>
                                                <span className="text-4xl font-bold text-white">₹{property.price.amount}</span>
                                                <span className="text-zinc-500">/{property.price.period}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between text-sm p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                                <span className="text-zinc-400">Status</span>
                                                <span className={property.liveStats.occupiedRooms < property.liveStats.totalRooms ? "text-green-500 font-bold flex items-center" : "text-red-500 font-bold"}>
                                                    {property.liveStats.occupiedRooms < property.liveStats.totalRooms ? (
                                                        <>
                                                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                                            Available
                                                        </>
                                                    ) : "Sold Out"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                                <span className="text-zinc-400">Rooms Left</span>
                                                <span className="font-mono text-white">{property.liveStats.totalRooms - property.liveStats.occupiedRooms}</span>
                                            </div>
                                        </div>

                                        <BookingButton
                                            propertyId={property._id.toString()}
                                            price={property.price.amount}
                                            propertyTitle={property.title}
                                        />

                                        <p className="text-center text-xs text-zinc-500 mt-4">
                                            No payment required today. Reserve now, pay later.
                                        </p>
                                    </CardContent>
                                </Card>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
