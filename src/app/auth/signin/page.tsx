'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function SignIn() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <Card className="w-full max-w-md relative z-10 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                        <Logo showText={false} iconClassName="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold tracking-tight text-white">
                            Welcome to Orbit
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Your gateway to premium student living
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                        <Button
                            size="lg"
                            className="w-full py-6 text-base font-medium bg-white text-black hover:bg-zinc-200 shadow-lg shadow-zinc-900/20 transition-all duration-300 hover:scale-[1.02] border-0"
                            onClick={() => signIn('auth0', { callbackUrl: '/' })}
                            suppressHydrationWarning
                        >
                            Sign in / Sign up
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>

                        <div className="text-center space-y-4">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                                Securely continue with
                            </p>
                            <div className="flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                {/* Icons representing available providers in Auth0 */}
                                <div className="flex items-center gap-2 text-xs font-medium bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Google
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> Apple
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Microsoft
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800/50">
                        <div className="grid grid-cols-2 gap-3 text-xs text-zinc-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Verified Listings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Secure Payments</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Direct Chat</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>24/7 Support</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="absolute bottom-8 text-center text-sm text-zinc-600">
                <Link href="/" className="hover:text-white transition-colors">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
