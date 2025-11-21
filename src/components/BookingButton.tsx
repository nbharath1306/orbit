'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BookingButton({ propertyId, price, propertyTitle }: { propertyId: string, price: number, propertyTitle: string }) {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleBookClick = () => {
        if (!session) {
            signIn();
            return;
        }
        setIsOpen(true);
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bookings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId,
                    amountPaid: 2000, // Token advance
                }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                    router.push('/dashboard'); // Redirect to dashboard
                }, 2000);
            } else {
                alert('Booking failed. Please try again.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="flex flex-col items-center justify-center py-10">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                        <p className="text-center text-zinc-400">
                            You have successfully booked a room at {propertyTitle}.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg" onClick={handleBookClick}>
                Book Now
            </Button>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Booking</DialogTitle>
                    <DialogDescription>
                        Pay a token advance of ₹2000 to reserve your room at {propertyTitle}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex justify-between items-center mb-4">
                        <span className="text-zinc-400">Token Amount</span>
                        <span className="text-xl font-bold">₹2000</span>
                    </div>
                    <div className="text-xs text-zinc-500 text-center">
                        This is a mock payment gateway powered by Orbit.
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handlePayment} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Simulate Razorpay Success
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
