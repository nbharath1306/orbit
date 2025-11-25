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

                        {/* Center Content */}
                        <div className="relative flex flex-col items-center gap-8 z-10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            >
                                <Logo className="text-white" iconClassName="w-24 h-24 md:w-32 md:h-32" showText={false} />
                            </motion.div>
                            
                            <div className="overflow-hidden h-[120px] md:h-[180px] flex items-center justify-center">
                                <motion.h1 
                                    className="text-9xl md:text-[12rem] font-bold tracking-tighter tabular-nums leading-none mix-blend-difference"
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                >
                                    {counter}%
                                </motion.h1>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end text-xs md:text-sm text-zinc-500 font-mono uppercase tracking-widest z-10">
                            <div className="hidden md:block text-left">
                                <span className="text-white font-bold">Orbit Student Living</span><br/>
                                <span className="opacity-50">Experience Elevated</span>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="flex gap-1.5">
                                    <motion.div 
                                        className="w-1.5 h-1.5 bg-white rounded-full"
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                    <motion.div 
                                        className="w-1.5 h-1.5 bg-white rounded-full"
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                    />
                                    <motion.div 
                                        className="w-1.5 h-1.5 bg-white rounded-full"
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                    />
                                </div>
                                <span className="text-white">Initializing System</span>
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
