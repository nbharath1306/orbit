'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Github } from 'lucide-react';
import Magnetic from '@/components/ui/Magnetic';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
    return (
        <footer className="bg-black text-white pt-20 pb-10 border-t border-zinc-900 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Brand */}
                    <div className="space-y-6">
                        <Link href="/" className="inline-block group">
                            <Logo className="text-white transition-transform group-hover:scale-105" />
                        </Link>
                        <p className="text-zinc-400 max-w-xs">
                            Redefining student living with premium spaces, verified listings, and a vibrant community.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-bold mb-6 text-lg">Platform</h4>
                        <ul className="space-y-4 text-zinc-400">
                            <li><Link href="/search" className="hover:text-white transition-colors">Browse PGs</Link></li>
                            <li><Link href="/map" className="hover:text-white transition-colors">Map View</Link></li>
                            <li><Link href="/list-property" className="hover:text-white transition-colors">List Your Property</Link></li>
                            <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-lg">Company</h4>
                        <ul className="space-y-4 text-zinc-400">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold mb-6 text-lg">Stay Updated</h4>
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-white/50 transition-colors"
                                suppressHydrationWarning
                            />
                            <button 
                                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                                suppressHydrationWarning
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Big Text */}
                <div className="border-t border-zinc-900 pt-20 pb-10">
                    <motion.h2 
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-[12vw] leading-[0.8] font-bold tracking-tighter text-center select-none text-zinc-900 hover:text-zinc-800 transition-colors duration-500"
                    >
                        ORBIT
                    </motion.h2>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-zinc-900/50">
                    <p className="text-zinc-500 text-sm">
                        © 2025 Orbit Technologies Inc. All rights reserved.
                    </p>
                    
                    <div className="flex gap-6">
                        {[Instagram, Twitter, Linkedin, Github].map((Icon, i) => (
                            <Magnetic key={i}>
                                <a href="#" className="text-zinc-400 hover:text-white transition-colors p-2">
                                    <Icon className="w-5 h-5" />
                                </a>
                            </Magnetic>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
