'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface BookingButtonProps {
    propertyId: string;
    price: number;
    propertyTitle: string;
}

export function BookingButton({ propertyTitle }: BookingButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleBooking = async () => {
        setLoading(true);
        // Simulate booking delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert(`Booking initiated for ${propertyTitle}! This would open the payment gateway.`);
        setLoading(false);
    };

    return (
        <Button
            className="w-full bg-white text-black hover:bg-zinc-200 h-12 text-lg font-bold rounded-xl transition-transform hover:scale-[1.02]"
            onClick={handleBooking}
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <Sparkles className="mr-2 h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Reserve Now
                </>
            )}
        </Button>
    );
}
