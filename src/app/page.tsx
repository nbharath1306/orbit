import HeroSection from '@/components/landing/HeroSection';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Shield, Zap, ArrowRight, Star, Users, Check, ArrowUpRight } from 'lucide-react';
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

			{/* Value Proposition Section - Bento Grid v2 */}
			<section className='py-32 px-4 border-t border-zinc-900 bg-zinc-950 relative overflow-hidden'>
				{/* Background Elements */}
				<div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950/0 to-zinc-950/0 pointer-events-none' />
				
				<div className='container mx-auto relative z-10'>
					<ScrollReveal>
						<div className='mb-20 max-w-3xl'>
							<h2 className='text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6'>
								NOT JUST A <br />
								<span className='text-zinc-600'>LISTING PLATFORM.</span>
							</h2>
							<p className='text-xl text-zinc-400 leading-relaxed'>
								We've rebuilt the student housing experience from the ground up. 
								No brokers, no fake photos, no surprises. Just seamless living.
							</p>
						</div>
					</ScrollReveal>

					<div className='grid grid-cols-1 md:grid-cols-4 grid-rows-3 gap-4 md:gap-6 h-auto md:h-[800px]'>
						
						{/* Card 1: The Orbit Verdict (Large Feature) */}
						<ScrollReveal className='md:col-span-2 md:row-span-2 h-full' width='100%'>
							<div className='group relative h-full w-full bg-zinc-900 rounded-3xl p-8 overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all duration-500'>
								<div className='absolute inset-0 bg-[url("https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2500&auto=format&fit=crop")] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-700' />
								<div className='absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent' />
								
								{/* Floating UI: The Verdict Card */}
								<div className='absolute top-8 right-8 w-64 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 p-4 rounded-2xl shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500'>
									<div className='flex justify-between items-center mb-4'>
										<span className='text-xs font-bold text-zinc-400 uppercase tracking-wider'>Orbit Verdict</span>
										<div className='bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded'>9.8/10</div>
									</div>
									<div className='space-y-2'>
										<div className='flex items-center gap-2 text-sm text-zinc-300'>
											<Check className='w-4 h-4 text-green-500' /> <span>Hygiene Verified</span>
										</div>
										<div className='flex items-center gap-2 text-sm text-zinc-300'>
											<Check className='w-4 h-4 text-green-500' /> <span>Internet Speed Test</span>
										</div>
										<div className='flex items-center gap-2 text-sm text-zinc-300'>
											<Check className='w-4 h-4 text-green-500' /> <span>Food Tasted</span>
										</div>
									</div>
								</div>

								<div className='relative z-10 h-full flex flex-col justify-end'>
									<div className='w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mb-6'>
										<Shield className='w-8 h-8' />
									</div>
									<h3 className='text-3xl md:text-4xl font-bold text-white mb-4'>The Orbit Verdict™</h3>
									<p className='text-zinc-400 text-lg max-w-md'>
										We don't just list properties. We audit them. Our team physically visits every PG to verify amenities, hygiene, and safety.
									</p>
								</div>
							</div>
						</ScrollReveal>

						{/* Card 2: Zero Brokerage (Tall) */}
						<ScrollReveal className='md:col-span-1 md:row-span-2 h-full' width='100%' delay={0.1}>
							<div className='group relative h-full bg-zinc-900 rounded-3xl p-6 border border-zinc-800 hover:bg-zinc-800/50 transition-all overflow-hidden flex flex-col'>
								<div className='absolute top-0 right-0 p-32 bg-green-500/10 blur-[80px] rounded-full' />
								
								<div className='flex-1 flex items-center justify-center'>
									<div className='relative'>
										<div className='text-[8rem] font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors leading-none'>0%</div>
										<div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white bg-zinc-900 px-4 py-2 border border-zinc-700 rounded-full whitespace-nowrap'>
											BROKERAGE
										</div>
									</div>
								</div>

								<div className='relative z-10 mt-auto'>
									<h3 className='text-xl font-bold text-white mb-2'>Direct Booking</h3>
									<p className='text-zinc-400 text-sm'>Connect directly with owners. Save up to ₹15,000 in hidden fees.</p>
								</div>
							</div>
						</ScrollReveal>

						{/* Card 3: Live Inventory (Standard) */}
						<ScrollReveal className='md:col-span-1 md:row-span-1 h-full' width='100%' delay={0.2}>
							<div className='group relative h-full bg-zinc-900 rounded-3xl p-6 border border-zinc-800 hover:border-blue-500/50 transition-all overflow-hidden'>
								<div className='absolute top-4 right-4 flex items-center gap-2'>
									<span className='relative flex h-3 w-3'>
										<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
										<span className='relative inline-flex rounded-full h-3 w-3 bg-blue-500'></span>
									</span>
									<span className='text-xs font-bold text-blue-400 uppercase'>Live</span>
								</div>

								<div className='h-full flex flex-col justify-end'>
									<Zap className='w-8 h-8 text-white mb-4' />
									<h3 className='text-xl font-bold text-white mb-1'>Real-time Inventory</h3>
									<p className='text-zinc-500 text-xs'>No "calling to check". If it's listed, it's available.</p>
								</div>
							</div>
						</ScrollReveal>

						{/* Card 4: Community (Standard) */}
						<ScrollReveal className='md:col-span-1 md:row-span-1 h-full' width='100%' delay={0.3}>
							<div className='group relative h-full bg-zinc-900 rounded-3xl p-6 border border-zinc-800 hover:border-purple-500/50 transition-all overflow-hidden'>
								<div className='absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity' />
								
								<div className='h-full flex flex-col justify-end'>
									<Users className='w-8 h-8 text-white mb-4' />
									<h3 className='text-xl font-bold text-white mb-1'>Student Community</h3>
									<p className='text-zinc-500 text-xs'>Events, gaming nights, and a network of peers.</p>
								</div>
							</div>
						</ScrollReveal>

						{/* Card 5: Smart Amenities (Wide) */}
						<ScrollReveal className='md:col-span-2 md:row-span-1 h-full' width='100%' delay={0.4}>
							<div className='group relative h-full bg-zinc-900 rounded-3xl p-8 border border-zinc-800 hover:bg-zinc-800/50 transition-all overflow-hidden flex items-center justify-between'>
								<div className='relative z-10'>
									<h3 className='text-2xl font-bold text-white mb-2'>Smart Living</h3>
									<p className='text-zinc-400 text-sm max-w-xs'>High-speed WiFi, biometric security, and app-based issue reporting.</p>
								</div>
								
								<div className='flex gap-4 opacity-50 group-hover:opacity-100 transition-opacity'>
									<div className='w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700'>
										<Zap className='w-6 h-6 text-white' />
									</div>
									<div className='w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700'>
										<Shield className='w-6 h-6 text-white' />
									</div>
									<div className='w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700'>
										<Star className='w-6 h-6 text-white' />
									</div>
								</div>
							</div>
						</ScrollReveal>

						{/* Card 6: Location (Wide) */}
						<ScrollReveal className='md:col-span-2 md:row-span-1 h-full' width='100%' delay={0.5}>
							<div className='group relative h-full bg-zinc-900 rounded-3xl p-8 border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden'>
								<div className='absolute inset-0 opacity-20' 
									style={{ backgroundImage: 'radial-gradient(#4f4f4f 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
								/>
								
								<div className='flex items-center justify-between relative z-10 h-full'>
									<div>
										<h3 className='text-2xl font-bold text-white mb-2'>Hyper Local</h3>
										<p className='text-zinc-400 text-sm'>Properties within <span className='text-white font-bold'>2km</span> of your campus.</p>
									</div>
									<div className='bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2'>
										<MapPin className='w-4 h-4' />
										Find Near Me
									</div>
								</div>
							</div>
						</ScrollReveal>

					</div>
				</div>
			</section>

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
								<Link href={`/pg/${prop.slug}`} className='group block relative'>
									<div className='relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-900'>
										<img
											src={prop.image}
											alt={prop.title}
											className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
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
