'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SignIn() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px]" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto bg-gradient-to-br from-primary to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 mb-2">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            Welcome to Orbit
                        </CardTitle>
                        <CardDescription className="text-base text-muted-foreground/80">
                            Your gateway to premium student living
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                        <Button
                            size="lg"
                            className="w-full py-6 text-lg font-medium bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
                            onClick={() => signIn('auth0', { callbackUrl: '/dashboard' })}
                        >
                            Sign in / Sign up
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>

                        <div className="text-center space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Securely continue with
                            </p>
                            <div className="flex justify-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                                {/* Icons representing available providers in Auth0 */}
                                <div className="flex items-center gap-1.5 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Google
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-white" /> Apple
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-orange-500" /> Microsoft
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                <span>Verified Listings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                <span>Secure Payments</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                <span>Direct Chat</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                <span>24/7 Support</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="absolute bottom-8 text-center text-sm text-muted-foreground/50">
                <Link href="/" className="hover:text-primary transition-colors">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
