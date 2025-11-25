import HeroSection from '@/components/landing/HeroSection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Shield, Zap, ArrowRight, Star, Users, Check } from 'lucide-react';
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
		image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
		rating: 3.8,
		tags: ['Budget', 'Freedom'],
	},
];

export default function Home() {
	return (
		<div className='min-h-screen bg-black text-zinc-100 selection:bg-white selection:text-black'>
			<HeroSection />

			{/* Value Proposition Section - Minimal & Grid */}
			<section className='py-32 px-4 border-t border-zinc-900'>
				<div className='container mx-auto'>
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-start'>
						<ScrollReveal>
							<h2 className='text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[0.9]'>
								WE DON'T JUST
								<br />
								<span className='text-zinc-500'>LIST ROOMS.</span>
							</h2>
							<p className='mt-8 text-xl text-zinc-400 max-w-md leading-relaxed'>
								We curate experiences. Every property is verified, every review is
								real, every student is satisfied.
							</p>

							<div className='mt-12 grid grid-cols-2 gap-8'>
								<div>
									<h3 className='text-4xl font-bold text-white'>500+</h3>
									<p className='text-zinc-500 mt-1'>Verified PGs</p>
								</div>
								<div>
									<h3 className='text-4xl font-bold text-white'>10K+</h3>
									<p className='text-zinc-500 mt-1'>Happy Students</p>
								</div>
							</div>
						</ScrollReveal>

						<div className='grid gap-4'>
							{[
								{
									title: '100% Verified',
									desc: 'Every property is physically visited and verified by our expert team.',
								},
								{
									title: 'Live Availability',
									desc: 'See real-time room availability with instant booking.',
								},
								{
									title: 'Hyper Local',
									desc: 'Built specifically for your campus and city.',
								},
							].map((feature, i) => (
								<ScrollReveal key={i} delay={0.2 + i * 0.1}>
									<div className='group p-8 border border-zinc-800 hover:bg-zinc-900 transition-colors duration-300'>
										<div className='flex items-start justify-between mb-4'>
											<h3 className='text-xl font-bold text-white group-hover:text-white transition-colors'>
												{feature.title}
											</h3>
											<ArrowRight className='w-5 h-5 text-zinc-600 group-hover:text-white transition-colors -rotate-45 group-hover:rotate-0 duration-300' />
										</div>
										<p className='text-zinc-500 group-hover:text-zinc-400 transition-colors'>
											{feature.desc}
										</p>
									</div>
								</ScrollReveal>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Featured Properties - Horizontal Scroll / Grid */}
			<section className='py-32 px-4 border-t border-zinc-900 bg-zinc-950'>
				<div className='container mx-auto'>
					<div className='flex flex-col md:flex-row justify-between items-end mb-16 gap-8'>
						<ScrollReveal>
							<h2 className='text-4xl md:text-6xl font-bold tracking-tighter text-white'>
								FEATURED
								<span className='text-zinc-600 ml-4'>SPACES</span>
							</h2>
						</ScrollReveal>

						<ScrollReveal delay={0.2}>
							<Link href='/search'>
								<Button
									variant='outline'
									className='rounded-none border-zinc-700 text-white hover:bg-white hover:text-black transition-all h-12 px-8 text-base'
								>
									View All Properties
								</Button>
							</Link>
						</ScrollReveal>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{FEATURED_PROPERTIES.map((prop, i) => (
							<ScrollReveal key={prop.id} delay={0.3 + i * 0.15}>
								<Link href={`/pg/${prop.slug}`} className='group block'>
									<div className='relative aspect-[4/3] overflow-hidden bg-zinc-900 mb-4'>
										<img
											src={prop.image}
											alt={prop.title}
											className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0'
										/>
										<div className='absolute top-4 left-4'>
											<span className='bg-white text-black text-xs font-bold px-2 py-1 uppercase tracking-wider'>
												{prop.tags[0]}
											</span>
										</div>
									</div>

									<div className='flex justify-between items-start'>
										<div>
											<h3 className='text-xl font-bold text-white mb-1 group-hover:underline decoration-zinc-600 underline-offset-4'>
												{prop.title}
											</h3>
											<p className='text-zinc-500 text-sm flex items-center gap-1'>
												<MapPin className='w-3 h-3' /> {prop.location}
											</p>
										</div>
										<div className='text-right'>
											<p className='text-lg font-bold text-white'>
												₹{prop.price.toLocaleString()}
											</p>
											<p className='text-xs text-zinc-500'>/month</p>
										</div>
									</div>
								</Link>
							</ScrollReveal>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section - Bold Typography */}
			<section className='py-40 px-4 border-t border-zinc-900 relative overflow-hidden'>
				<div className='container mx-auto text-center relative z-10'>
					<ScrollReveal>
						<h2 className='text-[12vw] leading-[0.8] font-bold tracking-tighter text-zinc-900 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none'>
							ORBIT
						</h2>

						<div className='relative z-10'>
							<h3 className='text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight'>
								READY TO MOVE IN?
							</h3>
							<p className='text-xl text-zinc-400 mb-12 max-w-2xl mx-auto'>
								Join thousands of students who found their dream home with Orbit.
								Verified properties, instant booking, zero hassle.
							</p>
							<Button
								size='lg'
								className='bg-white text-black hover:bg-zinc-200 rounded-full px-12 h-16 text-xl font-bold transition-all'
							>
								Get Started Now
							</Button>
						</div>
					</ScrollReveal>
				</div>
			</section>
		</div>
	);
}
