'use client';

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';

export function Preloader() {
    const [isLoading, setIsLoading] = useState(true);
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        // Counter animation
        const interval = setInterval(() => {
            setCounter(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Non-linear increment for more realistic feel
                const increment = Math.random() * 10 + 1;
                return Math.min(prev + Math.floor(increment), 100);
            });
        }, 50);

        const timer = setTimeout(() => {
            setIsLoading(false);
            document.body.style.cursor = 'default';
            window.scrollTo(0, 0);
        }, 2500);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <>
                    {/* Main Curtain */}
                    <motion.div
                        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white"
                        exit={{ y: "-100%" }}
                        transition={{ duration: 1.2, ease: [0.87, 0, 0.13, 1] }}
                    >
                        {/* Background Noise/Texture */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

                        {/* Top Left Logo - Minimalist */}
                        <div className="absolute top-8 left-8 z-20">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="flex items-center gap-2"
                            >
                                <Logo className="text-white" iconClassName="w-6 h-6" showText={true} textClassName="text-sm tracking-widest font-normal" />
                            </motion.div>
                        </div>

                        {/* Center Content - Absolute Center */}
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="relative overflow-hidden">
                                <motion.h1 
                                    className="text-[15vw] md:text-[20vw] font-bold tracking-tighter tabular-nums leading-none text-white mix-blend-difference select-none"
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                >
                                    {counter}
                                </motion.h1>
                                {/* Decorative line */}
                                <motion.div 
                                    className="absolute bottom-4 left-0 h-[2px] bg-white"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                            </div>
                        </div>

                        {/* Footer Info - Minimalist Grid */}
                        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end text-[10px] md:text-xs text-zinc-500 font-mono uppercase tracking-[0.2em] z-10">
                            <div className="hidden md:block text-left">
                                <span className="text-white">Bangalore, IN</span>
                            </div>
                            
                            <div className="flex gap-4 items-center">
                                <div className="flex gap-1.5">
                                    <motion.div 
                                        className="w-1 h-1 bg-white rounded-full"
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                    <motion.div 
                                        className="w-1 h-1 bg-white rounded-full"
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                    />
                                    <motion.div 
                                        className="w-1 h-1 bg-white rounded-full"
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                    />
                                </div>
                                <span className="text-white">Loading Assets</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Secondary Curtain for Layered Reveal */}
                    <motion.div
                        className="fixed inset-0 z-[9998] bg-zinc-900"
                        initial={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        transition={{ duration: 1.2, ease: [0.87, 0, 0.13, 1], delay: 0.1 }}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
