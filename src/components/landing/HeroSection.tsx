'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search, MapPin } from 'lucide-react';

export default function HeroSection() {
    return (
        <section className="relative min-h-screen w-full flex flex-col justify-center overflow-hidden pt-20 bg-black">
            {/* Content */}
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-[90vw] mx-auto">
                    {/* Main Typography */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-12"
                    >
                        <h1 className="text-[10vw] md:text-[12vw] leading-[0.85] font-bold tracking-tighter text-white mb-4 select-none">
                            STUDENT
                            <br />
                            <span className="text-zinc-600">LIVING.</span>
                            <br />
                            ELEVATED.
                        </h1>
                    </motion.div>

                    {/* Search Bar - Floating & Minimal */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-2xl"
                    >
                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-2 rounded-full flex items-center gap-2 pl-6 pr-2 h-16 group focus-within:border-white/20 transition-colors">
                            <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search by college or city..." 
                                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-600 text-lg"
                            />
                            <Button className="rounded-full h-12 px-8 bg-white text-black hover:bg-zinc-200 font-medium text-base transition-all">
                                Search
                            </Button>
                        </div>
                        
                        <div className="mt-6 flex gap-4 text-sm text-zinc-500 font-medium">
                            <span>Popular:</span>
                            <button className="hover:text-white transition-colors">Near DSU</button>
                            <button className="hover:text-white transition-colors">Harohalli</button>
                            <button className="hover:text-white transition-colors">Bangalore South</button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Decorative Elements - Abstract 3D Cards */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[40vw] h-[80vh] hidden lg:block pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="relative w-full h-full"
                >
                    {/* Card 1 */}
                    <div className="absolute top-10 right-20 w-64 h-80 bg-zinc-900 border border-zinc-800 rounded-xl p-4 transform rotate-6 opacity-40">
                        <div className="w-full h-40 bg-zinc-800 rounded-lg mb-4" />
                        <div className="w-3/4 h-4 bg-zinc-800 rounded mb-2" />
                        <div className="w-1/2 h-4 bg-zinc-800 rounded" />
                    </div>
                    
                    {/* Card 2 */}
                    <div className="absolute top-40 right-40 w-72 h-96 bg-zinc-900 border border-zinc-800 rounded-xl p-4 transform -rotate-3 opacity-60 z-10">
                        <div className="w-full h-48 bg-zinc-800 rounded-lg mb-4" />
                        <div className="w-3/4 h-4 bg-zinc-800 rounded mb-2" />
                        <div className="w-1/2 h-4 bg-zinc-800 rounded" />
                    </div>

                    {/* Card 3 - Main */}
                    <div className="absolute top-60 right-10 w-80 h-[28rem] bg-zinc-950 border border-zinc-800 rounded-xl p-4 transform rotate-2 z-20 shadow-2xl">
                        <div className="w-full h-64 bg-zinc-900 rounded-lg mb-6 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                            <div className="absolute bottom-4 left-4 bg-white text-black text-xs font-bold px-2 py-1 rounded">
                                VERIFIED
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-bold text-lg">Premium Student Suite</h3>
                                    <p className="text-zinc-500 text-sm flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> 5 mins from Campus
                                    </p>
                                </div>
                                <span className="text-white font-bold">₹8,500<span className="text-zinc-600 text-xs font-normal">/mo</span></span>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <span className="px-2 py-1 rounded border border-zinc-800 text-xs text-zinc-400">WiFi</span>
                                <span className="px-2 py-1 rounded border border-zinc-800 text-xs text-zinc-400">AC</span>
                                <span className="px-2 py-1 rounded border border-zinc-800 text-xs text-zinc-400">Food</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
