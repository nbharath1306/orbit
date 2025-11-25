import Image from 'next/image';
import HeroSection from '@/components/landing/HeroSection';
import WhyOrbit from '@/components/landing/WhyOrbit';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowUpRight } from 'lucide-react';
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

			<WhyOrbit />

			{/* Featured Properties - Immersive Cards */}
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
									className='rounded-full border-zinc-700 text-white hover:bg-white hover:text-black transition-all h-12 px-8 text-base'
								>
									View All Properties
								</Button>
							</Link>
						</ScrollReveal>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						{FEATURED_PROPERTIES.map((prop, i) => (
							<ScrollReveal key={prop.id} delay={0.3 + i * 0.15}>
								<Link href={`/pg/${prop.slug}`} className='group block relative cursor-pointer' prefetch={true}>
									<div className='relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-900 transition-transform duration-300 active:scale-95'>
										<Image
											src={prop.image}
											alt={prop.title}
											fill
											className='object-cover transition-transform duration-700 group-hover:scale-110'
											sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
										/>
										{/* Gradient Overlay - Subtle */}
										<div className='absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity' />

										{/* Content Overlay */}
										<div className='absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300'>
											<div className='flex justify-between items-end mb-2'>
												<h3 className='text-2xl font-bold text-white leading-tight'>
													{prop.title}
												</h3>
												<div className='bg-white text-black rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0'>
													<ArrowUpRight className='w-5 h-5' />
												</div>
											</div>

											<p className='text-zinc-300 text-sm flex items-center gap-1 mb-4'>
												<MapPin className='w-3 h-3' /> {prop.location}
											</p>

											<div className='flex items-center justify-between border-t border-white/20 pt-4'>
												<div className='flex gap-2'>
													{prop.tags.map((tag) => (
														<span
															key={tag}
															className='text-[10px] uppercase tracking-wider font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded text-white'
														>
															{tag}
														</span>
													))}
												</div>
												<p className='text-lg font-bold text-white'>
													₹{prop.price.toLocaleString()}
													<span className='text-xs font-normal text-zinc-400'>
														/mo
													</span>
												</p>
											</div>
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
						<h2 className='text-[15vw] leading-[0.8] font-bold tracking-tighter text-zinc-900 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none'>
							ORBIT
						</h2>

						<div className='relative z-10'>
							<h3 className='text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight'>
								READY TO MOVE IN?
							</h3>
							<p className='text-xl text-zinc-400 mb-12 max-w-2xl mx-auto'>
								Join thousands of students who found their dream home with Orbit. Verified
								properties, instant booking, zero hassle.
							</p>
							<Button
								size='lg'
								className='bg-white text-black hover:bg-zinc-200 rounded-full px-12 h-16 text-xl font-bold transition-all hover:scale-105'
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
