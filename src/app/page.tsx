import HeroSection from '@/components/landing/HeroSection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Shield, Zap, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

// Mock Data for Featured Properties
const FEATURED_PROPERTIES = [
  {
    id: '1',
    title: 'Sai Balaji PG',
    slug: 'sai-balaji-pg',
    location: 'Harohalli, Karnataka',
    price: 6500,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
    rating: 4.5,
    tags: ['Premium', 'Food Included'],
  },
  {
    id: '2',
    title: 'DSU Hostels',
    slug: 'dsu-hostels',
    location: 'DSU Campus',
    price: 9000,
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    rating: 4.2,
    tags: ['On Campus', 'Secure'],
  },
  {
    id: '3',
    title: 'Green View Residency',
    slug: 'green-view',
    location: 'Near Bus Stand',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1522771753037-6333d7911961?ixlib=rb-4.0.3&auto=format&fit=crop&w=2051&q=80',
    rating: 3.8,
    tags: ['Budget', 'Freedom'],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeroSection />

      {/* Value Proposition Section */}
      <section className="py-24 px-4 container mx-auto">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Orbit?</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            We don&apos;t just list rooms. We curate experiences. Every property is verified, every review is real.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: '100% Verified',
              desc: 'Every property is physically visited and verified by our team.',
            },
            {
              icon: Zap,
              title: 'Live Availability',
              desc: 'See real-time room availability. No more calling owners.',
            },
            {
              icon: MapPin,
              title: 'Hyper Local',
              desc: 'Built specifically for your campus. We know the best spots.',
            },
          ].map((feature, i) => (
            <ScrollReveal key={i} delay={0.2 + i * 0.1}>
              <Card className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 text-blue-400">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.desc}</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 px-4 bg-zinc-900/30 border-y border-white/5">
        <div className="container mx-auto">
          <div className="flex justify-between items-end mb-12">
            <ScrollReveal>
              <h2 className="text-3xl md:text-5xl font-bold mb-2">Featured Spaces</h2>
              <p className="text-zinc-400">Top rated stays near you</p>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <Link href="/search">
                <Button variant="link" className="text-blue-400 hover:text-blue-300">
                  View All <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_PROPERTIES.map((prop, i) => (
              <ScrollReveal key={prop.id} delay={0.2 + i * 0.1}>
                <Link href={`/pg/${prop.slug}`}>
                  <Card className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-all hover:-translate-y-1">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        {prop.tags.map((tag) => (
                          <Badge key={tag} className="bg-black/60 backdrop-blur-md border-white/10 text-white hover:bg-black/80">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{prop.title}</h3>
                          <div className="flex items-center text-zinc-400 text-sm mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {prop.location}
                          </div>
                        </div>
                        <div className="flex items-center bg-yellow-500/10 px-2 py-1 rounded text-yellow-500 text-xs font-bold">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          {prop.rating}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold">₹{prop.price}</span>
                          <span className="text-zinc-500 text-sm">/month</span>
                        </div>
                        <Button size="sm" className="rounded-full">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 container mx-auto text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-3xl -z-10" />
        <ScrollReveal>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to find your space?</h2>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Join thousands of students who found their perfect home with Orbit.
          </p>
          <Button size="lg" className="bg-white text-black hover:bg-zinc-200 rounded-full px-10 h-14 text-lg font-bold">
            Get Started Now
          </Button>
        </ScrollReveal>
      </section>
    </div>
  );
}
