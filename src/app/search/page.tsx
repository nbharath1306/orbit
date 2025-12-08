import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, MapPin, Star, Filter, ArrowLeft } from 'lucide-react';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import { FilterQuery } from 'mongoose';
import { IProperty } from '@/models/Property';

async function getProperties(search: string) {
    await dbConnect();
    const query: Record<string, unknown> = {};
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { 'location.address': { $regex: search, $options: 'i' } },
        ];
    }
    const properties = await Property.find(query).lean();
    return properties;
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>;
}) {
    const { search = '' } = await searchParams;
    const properties = await getProperties(search);

    return (
        <div className="min-h-screen bg-black text-zinc-100">
            {/* Back Button */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-zinc-800">
                <div className="container mx-auto px-4 py-4">
                    <Link href="/dashboard/bookings" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bookings
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">
                        {search ? `Results for "${search}"` : 'All Properties'}
                    </h1>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <form action="/search">
                                <Input
                                    name="search"
                                    defaultValue={search}
                                    placeholder="Search..."
                                    className="pl-9 bg-zinc-900 border-zinc-800"
                                    suppressHydrationWarning
                                />
                            </form>
                        </div>
                        <Button variant="outline" className="border-zinc-800">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                    </div>
                </div>

                {properties.length === 0 ? (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                        <p className="text-zinc-500">Try adjusting your search terms.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((prop: Record<string, unknown>) => {
                            const propData = prop as Record<string, unknown>;
                            const media = propData.media as Record<string, unknown>;
                            const images = media.images as string[];
                            const liveStats = propData.liveStats as Record<string, unknown>;
                            const location = propData.location as Record<string, unknown>;
                            const amenities = propData.amenities as string[];
                            const price = propData.price as Record<string, unknown>;
                            return (
                                <Link href={`/pg/${propData.slug}`} key={prop._id as string}>
                                    <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-all duration-300 h-full overflow-hidden group">
                                        <div className="relative h-56 overflow-hidden bg-zinc-800">
                                            <Image
                                                src={images[0]}
                                                alt={propData.title as string}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1 z-10">
                                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                4.5
                                            </div>
                                            {(liveStats.occupiedRooms as number) >= (liveStats.totalRooms as number) && (
                                                <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white">
                                                    FULL
                                                </div>
                                            )}
                                        </div>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{propData.title as string}</CardTitle>
                                                <Badge variant={(liveStats.occupiedRooms as number) < (liveStats.totalRooms as number) ? "default" : "destructive"} className="ml-2">
                                                    {(liveStats.totalRooms as number) - (liveStats.occupiedRooms as number)} Left
                                                </Badge>
                                            </div>
                                            <div className="flex items-center text-zinc-400 text-sm">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {location.address as string}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2">
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {amenities.slice(0, 4).map((amenity: string) => (
                                                    <Badge key={amenity} variant="secondary" className="bg-zinc-800 text-zinc-300">
                                                        {amenity}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0 flex items-center justify-between">
                                            <div>
                                                <span className="text-xl font-bold text-blue-400">₹{price.amount as number}</span>
                                                <span className="text-zinc-500 text-sm">/{price.period as string}</span>
                                            </div>
                                            <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-white">
                                                View Details
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
