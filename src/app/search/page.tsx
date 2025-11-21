import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, MapPin, Star, Filter } from 'lucide-react';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

async function getProperties(search: string) {
    await dbConnect();
    let query: any = {};
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
                    {properties.map((prop: any) => (
                        <Link href={`/pg/${prop.slug}`} key={prop._id}>
                            <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-all duration-300 h-full overflow-hidden group">
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={prop.media.images[0]}
                                        alt={prop.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1">
                                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                        4.5
                                    </div>
                                    {prop.liveStats.occupiedRooms >= prop.liveStats.totalRooms && (
                                        <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white">
                                            FULL
                                        </div>
                                    )}
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{prop.title}</CardTitle>
                                        <Badge variant={prop.liveStats.occupiedRooms < prop.liveStats.totalRooms ? "default" : "destructive"} className="ml-2">
                                            {prop.liveStats.totalRooms - prop.liveStats.occupiedRooms} Left
                                        </Badge>
                                    </div>
                                    <div className="flex items-center text-zinc-400 text-sm">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {prop.location.address}
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {prop.amenities.slice(0, 4).map((amenity: string) => (
                                            <Badge key={amenity} variant="secondary" className="bg-zinc-800 text-zinc-300">
                                                {amenity}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex items-center justify-between">
                                    <div>
                                        <span className="text-xl font-bold text-blue-400">₹{prop.price.amount}</span>
                                        <span className="text-zinc-500 text-sm">/{prop.price.period}</span>
                                    </div>
                                    <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-white">
                                        View Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
