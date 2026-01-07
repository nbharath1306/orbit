import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Check, Shield, Star, User as UserIcon, Share2, Heart } from 'lucide-react';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Review from '@/models/Review';
import User from '@/models/User';
import { BookingButton } from '@/components/BookingButton';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Button } from '@/components/ui/button';
import BookingModal from '@/components/user/bookings/BookingModal';
import ReviewModal from '@/components/user/reviews/ReviewModal';
import ReviewCard from '@/components/user/reviews/ReviewCard';
import { PropertyImageGallery } from '@/components/PropertyImageGallery';
import ChatNavigationButton from '@/components/user/messaging/ChatNavigationButton';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to ensure we have 4 valid images with fallbacks
function ensureValidImages(property: any) {
    // Use Unsplash images for reliable fallbacks
    const placeholders = [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1522771753035-4a53c9d1314f?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop'
    ];

    // Filter out invalid images first
    let images = Array.isArray(property.media?.images)
        ? property.media.images.filter((img: any) => img && typeof img === 'string' && img.startsWith('http'))
        : [];

    // Fill with placeholders if needed
    const currentCount = images.length;
    if (currentCount < 4) {
        const needed = 4 - currentCount;
        for (let i = 0; i < needed; i++) {
            // Use the initial count + i to pick placeholders sequentially
            // This avoids the issue of using the changing array length
            images.push(placeholders[(currentCount + i) % placeholders.length]);
        }
    }

    return {
        ...property,
        media: {
            ...(property.media || {}),
            images: images
        }
    };
}

async function getProperty(slug: string) {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const property = await Property.findOne({ slug })
        .populate('ownerId', 'name email')
        .lean() as any;
    return property ? ensureValidImages(property) : null;
}

async function getPropertyReviews(propertyId: string) {
    await dbConnect();
    try {
        const reviews = await Review.find({ 
            propertyId, 
            status: 'approved' 
        })
            .populate('studentId', 'name image')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        
        // Serialize MongoDB objects to plain objects
        const serializedReviews = reviews.map((review: any) => ({
            _id: review._id?.toString() || '',
            studentId: review.studentId ? {
                _id: review.studentId._id?.toString() || '',
                name: review.studentId.name || 'Anonymous',
                image: review.studentId.image || null,
            } : null,
            propertyId: review.propertyId?.toString() || propertyId,
            rating: review.rating || 0,
            cleanliness: review.cleanliness || 0,
            communication: review.communication || 0,
            accuracy: review.accuracy || 0,
            location: review.location || 0,
            value: review.value || 0,
            title: review.title || '',
            comment: review.comment || '',
            pros: review.pros || [],
            cons: review.cons || [],
            images: review.images || [],
            isAnonymous: review.isAnonymous || false,
            isVerifiedStay: review.isVerifiedStay || false,
            status: review.status || 'approved',
            helpfulCount: review.helpfulCount || 0,
            reportCount: review.reportCount || 0,
            ownerResponse: review.ownerResponse || null,
            createdAt: review.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: review.updatedAt?.toISOString() || new Date().toISOString(),
        }));

        // Calculate averages from the reviews we found
        let averages: any = {
            avgRating: 0,
            totalReviews: serializedReviews.length,
            avgCleanliness: 0,
            avgCommunication: 0,
            avgAccuracy: 0,
            avgLocation: 0,
            avgValue: 0,
        };

        if (serializedReviews.length > 0) {
            const sum = {
                rating: 0,
                cleanliness: 0,
                communication: 0,
                accuracy: 0,
                location: 0,
                value: 0,
            };
            
            serializedReviews.forEach((review) => {
                sum.rating += review.rating;
                sum.cleanliness += review.cleanliness;
                sum.communication += review.communication;
                sum.accuracy += review.accuracy;
                sum.location += review.location;
                sum.value += review.value;
            });

            const count = serializedReviews.length;
            averages = {
                avgRating: Math.round((sum.rating / count) * 10) / 10,
                avgCleanliness: Math.round((sum.cleanliness / count) * 10) / 10,
                avgCommunication: Math.round((sum.communication / count) * 10) / 10,
                avgAccuracy: Math.round((sum.accuracy / count) * 10) / 10,
                avgLocation: Math.round((sum.location / count) * 10) / 10,
                avgValue: Math.round((sum.value / count) * 10) / 10,
                totalReviews: count,
            };
        }

        return {
            reviews: serializedReviews,
            averages,
        };
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return { reviews: [], averages: null };
    }
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const property = await getProperty(slug);

    if (!property) {
        notFound();
    }

    const { reviews, averages } = await getPropertyReviews(property._id.toString());

    // Get current user session
    const session = await getServerSession(authOptions);
    let currentUserId: string | null = null;
    
    if (session?.user?.email) {
        try {
            const currentUser = await User.findOne({ email: session.user.email }).select('_id').lean();
            currentUserId = currentUser?._id?.toString() || null;
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    }

    // Mark which reviews are authored by current user
    const reviewsWithAuthorInfo = reviews.map((review: any) => ({
        ...review,
        isAuthor: currentUserId ? review.studentId?._id === currentUserId : false,
    }));

    const propData = property as Record<string, unknown>;
    const location = propData.location as Record<string, unknown>;
    const media = propData.media as Record<string, unknown>;
    const mediaImages = media.images as string[];
    const liveStats = propData.liveStats as Record<string, unknown>;
    const price = propData.price as Record<string, unknown>;
    const sentimentTags = propData.sentimentTags as string[];
    const amenities = propData.amenities as string[];

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-20">
            {/* Immersive Header Image */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                <Image
                    src={property.media.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover"
                    priority
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
                    </ScrollReveal >
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-30">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Media Gallery */}
                        <ScrollReveal delay={0.2}>
                            <PropertyImageGallery
                                key={property._id.toString()}
                                images={property.media.images}
                                virtualTourUrl={property.media.virtualTourUrl}
                                videoUrl={property.location.directionsVideoUrl}
                            />
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
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Student Reviews</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${
                                                                i < Math.round(averages?.avgRating || 0)
                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                    : 'text-zinc-600'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-lg font-bold text-white">
                                                    {(averages?.avgRating || 0).toFixed(1)}
                                                </span>
                                                <span className="text-sm text-zinc-400">
                                                    ({averages?.totalReviews || 0} reviews)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        <ReviewModal 
                                            propertyId={property._id.toString()}
                                            bookingId=""
                                            trigger={<Button className="rounded-full bg-blue-600 hover:bg-blue-700">✍️ Write a Review</Button>}
                                        />
                                        {property.ownerId && (
                                            <ChatNavigationButton
                                                propertyId={property._id.toString()}
                                                propertyTitle={property.title}
                                                ownerId={property.ownerId._id?.toString() || property.ownerId}
                                                ownerName={property.ownerId.name || 'Owner'}
                                            />
                                        )}
                                    </div>
                                </div>

                                {reviews.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {reviewsWithAuthorInfo.map((review: any) => (
                                            <ReviewCard 
                                                key={review._id} 
                                                review={review}
                                                showProperty={false}
                                                isAuthor={review.isAuthor}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-zinc-400 mb-4">No reviews yet. Be the first to review!</p>
                                        <ReviewModal 
                                            propertyId={property._id.toString()}
                                            bookingId=""
                                            trigger={<Button className="bg-blue-600 hover:bg-blue-700">Write First Review</Button>}
                                        />
                                    </div>
                                )}
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Right Column: Sticky Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <ScrollReveal delay={0.6}>
                                {/* Verdict Box */}
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-3 text-white font-bold">
                                        <Shield className="h-5 w-5" />
                                        Circle13 Verdict
                                    </div>
                                    <p className="text-zinc-400 text-sm italic leading-relaxed">
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

                                        <BookingModal 
                                            property={{
                                                _id: property._id.toString(),
                                                title: property.title,
                                                price: { amount: property.price.amount, period: property.price.period },
                                                liveStats: { 
                                                    totalRooms: property.liveStats.totalRooms,
                                                    occupiedRooms: property.liveStats.occupiedRooms
                                                }
                                            }}
                                            trigger={
                                                <Button 
                                                    className="w-full py-6 text-lg font-bold rounded-xl"
                                                    disabled={property.liveStats.occupiedRooms >= property.liveStats.totalRooms}
                                                >
                                                    {property.liveStats.occupiedRooms >= property.liveStats.totalRooms ? 'Fully Booked' : 'Book Now'}
                                                </Button>
                                            }
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
