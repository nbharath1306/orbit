'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, MapPin, ArrowUpRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <section ref={containerRef} className="relative min-h-screen w-full flex flex-col justify-center overflow-hidden bg-black selection:bg-white selection:text-black">
            
            {/* Spotlight Effect */}
            <div 
                className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`
                }}
            />

            {/* Animated Grid Background */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-white opacity-20 blur-[100px]" />
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 relative z-40">
                <div className="max-w-[90vw] mx-auto">
                    {/* Main Typography - Kinetic & Big */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-12 relative"
                    >
                        <h1 className="text-[11vw] md:text-[13vw] leading-[0.8] font-bold tracking-tighter text-white mb-4 select-none mix-blend-difference">
                            STUDENT
                            <br />
                            <span className="text-zinc-700">LIVING.</span>
                            <br />
                            <span className="relative inline-block">
                                ELEVATED.
                                <motion.div 
                                    className="absolute -right-4 md:-right-12 top-2 md:top-8 w-4 h-4 md:w-8 md:h-8 bg-blue-600 rounded-full"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </span>
                        </h1>
                    </motion.div>

                    {/* Search Bar - Glass & Blur */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-2xl relative z-50"
                    >
                        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 p-2 rounded-full flex items-center gap-2 pl-6 pr-2 h-16 group focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-2xl shadow-black/50">
                            <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search by college or city..." 
                                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-600 text-lg"
                            />
                            <Button className="rounded-full h-12 px-8 bg-white text-black hover:bg-zinc-200 font-medium text-base transition-all hover:scale-105 active:scale-95">
                                Search
                            </Button>
                        </div>
                        
                        <div className="mt-6 flex gap-4 text-sm text-zinc-500 font-medium">
                            <span>Trending:</span>
                            {['Near DSU', 'Koramangala', 'Electronic City'].map((item) => (
                                <button key={item} className="hover:text-white transition-colors underline decoration-zinc-800 hover:decoration-white underline-offset-4">
                                    {item}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Decorative Elements - Parallax Cards */}
            <div className="absolute right-0 top-0 h-full w-[45vw] hidden lg:block pointer-events-none z-10">
                {/* Floating Card 1 */}
                <motion.div 
                    style={{ y: y1 }}
                    className="absolute top-[15%] right-[15%] w-72 aspect-[3/4] bg-zinc-900 rounded-xl border border-white/10 overflow-hidden shadow-2xl rotate-[-6deg]"
                >
                    <img 
                        src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop" 
                        alt="Modern Interior" 
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                        <p className="text-white font-bold text-lg">The Loft</p>
                        <p className="text-zinc-400 text-sm">₹12,000/mo</p>
                    </div>
                </motion.div>

                {/* Floating Card 2 */}
                <motion.div 
                    style={{ y: y2 }}
                    className="absolute top-[40%] right-[5%] w-80 aspect-[3/4] bg-zinc-900 rounded-xl border border-white/10 overflow-hidden shadow-2xl rotate-[3deg] z-20"
                >
                    <img 
                        src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop" 
                        alt="Student Housing" 
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex justify-between items-end w-[calc(100%-2rem)]">
                        <div>
                            <p className="text-white font-bold text-lg">Urban Stay</p>
                            <div className="flex items-center gap-1 text-zinc-400 text-xs mt-1">
                                <MapPin className="w-3 h-3" /> 0.5km to Campus
                            </div>
                        </div>
                        <div className="bg-white text-black rounded-full p-2">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
