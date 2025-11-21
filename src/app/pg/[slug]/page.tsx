import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Check, Shield, Star, User } from 'lucide-react';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import { BookingButton } from '@/components/BookingButton';

async function getProperty(slug: string) {
    await dbConnect();
    const property = await Property.findOne({ slug }).populate('ownerId', 'name').lean();
    return property;
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const property = await getProperty(slug);

    if (!property) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Media & Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
                        <div className="flex items-center text-zinc-400 mb-4">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.location.address}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {property.sentimentTags.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="border-blue-500/30 text-blue-400">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Media Tabs */}
                    <Tabs defaultValue="photos" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
                            <TabsTrigger value="photos">Photos</TabsTrigger>
                            <TabsTrigger value="360">360° Tour</TabsTrigger>
                            <TabsTrigger value="video">Video</TabsTrigger>
                        </TabsList>
                        <TabsContent value="photos" className="mt-4">
                            <div className="aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                                <img
                                    src={property.media.images[0]}
                                    alt={property.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="360" className="mt-4">
                            <div className="aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
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
                        <TabsContent value="video" className="mt-4">
                            <div className="aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                {property.location.directionsVideoUrl ? (
                                    <div className="text-zinc-500">Video Player Placeholder</div>
                                ) : (
                                    <div className="text-zinc-500">No Video available</div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Description & Amenities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">About</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                {property.description}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-4">Amenities</h3>
                            <ul className="space-y-2">
                                {property.amenities.map((amenity: string) => (
                                    <li key={amenity} className="flex items-center text-zinc-300">
                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                        {amenity}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Reviews Section (Placeholder) */}
                    <div className="border-t border-zinc-800 pt-8">
                        <h3 className="text-xl font-bold mb-6">Student Reviews</h3>
                        <div className="space-y-4">
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                                <User className="h-4 w-4 text-zinc-400" />
                                            </div>
                                            <span className="font-medium">Anonymous Student</span>
                                        </div>
                                        <div className="flex items-center text-yellow-500">
                                            <Star className="h-4 w-4 fill-current" />
                                            <span className="ml-1 text-sm">4.0</span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-400 text-sm">
                                        Great place, food is decent. Internet is fast.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Right Column: Booking Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        {/* Verdict Box */}
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold">
                                <Shield className="h-5 w-5" />
                                Circle13 Verdict
                            </div>
                            <p className="text-zinc-300 text-sm italic">
                                "{property.verdict || 'Verified by our team. Safe and recommended.'}"
                            </p>
                        </div>

                        {/* Booking Card */}
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-baseline mb-6">
                                    <span className="text-3xl font-bold">₹{property.price.amount}</span>
                                    <span className="text-zinc-500">/{property.price.period}</span>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Status</span>
                                        <span className={property.liveStats.occupiedRooms < property.liveStats.totalRooms ? "text-green-500" : "text-red-500"}>
                                            {property.liveStats.occupiedRooms < property.liveStats.totalRooms ? "Available" : "Sold Out"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Rooms Left</span>
                                        <span>{property.liveStats.totalRooms - property.liveStats.occupiedRooms}</span>
                                    </div>
                                </div>

                                <BookingButton
                                    propertyId={property._id.toString()}
                                    price={property.price.amount}
                                    propertyTitle={property.title}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
