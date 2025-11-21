import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, ShieldCheck, Zap, Star } from 'lucide-react';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

async function getFeaturedProperties() {
  try {
    await dbConnect();
    // Fetch 3 properties, ideally verified ones or just latest
    const properties = await Property.find({}).limit(3).lean();
    return properties;
  } catch (error) {
    console.warn('Failed to fetch properties (DB might be offline):', error);
    return [];
  }
}

export default async function Home() {
  const properties = await getFeaturedProperties();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background -z-10" />
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-4 border-blue-500/50 text-blue-400 px-4 py-1 rounded-full">
            v1.0 Public Beta
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
            Find your <span className="text-blue-500">Orbit</span>.
            <br />
            Student housing, solved.
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Hyper-local, verified PGs and hostels for DSU & Jain University students.
            No brokers, no nonsense.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <form action="/search">
              <Input
                name="search"
                placeholder="Search by college, area, or PG name..."
                className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 focus:ring-blue-500 rounded-xl text-lg"
              />
            </form>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-blue-500" />
              Verified Stays
            </h2>
            <Link href="/search">
              <Button variant="link" className="text-blue-400">View All &rarr;</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {properties.map((prop: any) => (
              <Link href={`/pg/${prop.slug}`} key={prop._id}>
                <Card className="bg-zinc-900 border-zinc-800 hover:border-blue-500/50 transition-all duration-300 h-full overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={prop.media.images[0]}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      4.5
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{prop.title}</CardTitle>
                    <div className="flex items-center text-zinc-400 text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      {prop.location.address}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {prop.amenities.slice(0, 3).map((amenity: string) => (
                        <Badge key={amenity} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                          {amenity}
                        </Badge>
                      ))}
                      {prop.amenities.length > 3 && (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                          +{prop.amenities.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-blue-400">₹{prop.price.amount}</span>
                      <span className="text-zinc-500 text-sm">/{prop.price.period}</span>
                    </div>
                    <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-white">
                      View
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Orbit Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Orbit?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">100% Verified</h3>
              <p className="text-zinc-400">Every property is physically visited and verified by our team. No fake listings.</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Booking</h3>
              <p className="text-zinc-400">Book your room in under 5 minutes. Pay token advance and secure your spot.</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Hyper Local</h3>
              <p className="text-zinc-400">We know the best spots near DSU and Jain. We live here too.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
