'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Magnetic from '@/components/ui/Magnetic';
import { Logo } from '@/components/ui/Logo';

export function Navbar() {
    const { data: session } = useSession();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled
                    ? "bg-black/80 backdrop-blur-md border-b border-white/10 py-2"
                    : "bg-transparent py-4"
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="group">
                    <Logo className="text-white transition-transform group-hover:scale-105" />
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {!session && (
                        <Link href="/owner/dashboard" className="hidden md:block">
                            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-white/10 rounded-full">
                                List Your Property
                            </Button>
                        </Link>
                    )}

                    <Link href="/search">
                        <Magnetic>
                            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-white/10 rounded-full">
                                <Search className="h-4 w-4 mr-2" />
                                Find PGs
                            </Button>
                        </Magnetic>
                    </Link>

                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8 border border-white/20">
                                        <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                                        <AvatarFallback>{session.user?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none text-white">{session.user?.name}</p>
                                        <p className="text-xs leading-none text-zinc-400">
                                            {session.user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                {(session.user as any)?.role === 'admin' && (
                                    <>
                                        <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white cursor-pointer" suppressHydrationWarning>
                                            <Link href="/admin">Admin Dashboard</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                    </>
                                )}
                                {(session.user as any)?.role === 'owner' && (
                                    <>
                                        <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white cursor-pointer" suppressHydrationWarning>
                                            <Link href="/owner/dashboard">Owner Dashboard</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                    </>
                                )}
                                {!(session.user as any)?.role || (session.user as any)?.role === 'student' ? (
                                    <>
                                        <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white cursor-pointer" suppressHydrationWarning>
                                            <Link href="/dashboard">Dashboard</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                    </>
                                ) : null}
                                <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white cursor-pointer" suppressHydrationWarning>
                                    <Link href="/">Home</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="focus:bg-zinc-800 focus:text-white cursor-pointer" suppressHydrationWarning>
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Magnetic>
                            <Button 
                                onClick={() => signIn()} 
                                size="sm" 
                                className="bg-white text-black hover:bg-zinc-200 rounded-full font-medium"
                                suppressHydrationWarning
                            >
                                Sign In
                            </Button>
                        </Magnetic>
                    )}
                </div>
            </div>
        </nav>
    );
}
