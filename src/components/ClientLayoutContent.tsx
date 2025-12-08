'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { Preloader } from '@/components/ui/Preloader';
import { Footer } from '@/components/Footer';

export function ClientLayoutContent({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [NavbarComponent, setNavbarComponent] = useState<any>(null);
    const [ChatComponent, setChatComponent] = useState<any>(null);
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/owner') || pathname?.startsWith('/dashboard');
    const isSearchPage = pathname?.startsWith('/search');

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.8,
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        const loadComponents = async () => {
            try {
                const navbar = await import('@/components/Navbar').then(m => m.Navbar);
                const chat = await import('@/components/ChatWidgetWrapper').then(m => m.ChatWidgetWrapper);
                setNavbarComponent(() => navbar);
                setChatComponent(() => chat);
            } catch (error) {
                console.error('Error loading components:', error);
            }
            setMounted(true);
        };

        loadComponents();

        return () => {
            lenis.destroy();
        };
    }, []);

    return (
        <>
            {mounted && <Preloader />}
            {mounted && <CustomCursor />}
            {mounted && <NoiseOverlay />}
            {mounted && !isDashboard && !isSearchPage && (NavbarComponent ? <NavbarComponent /> : <div className="h-16 border-b border-zinc-800" />)}
            <main className="flex-1">
                {children}
            </main>
            {!isDashboard && !isSearchPage && <Footer />}
            {mounted && !isDashboard && !isSearchPage && ChatComponent && <ChatComponent />}
        </>
    );
}
