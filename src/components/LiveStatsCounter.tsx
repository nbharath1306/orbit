'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LiveStatsCounter({ propertyId, initialCount, total }: { propertyId: string, initialCount: number, total: number }) {
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const updateStats = async (newCount: number) => {
        if (newCount < 0 || newCount > total) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/properties/${propertyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ occupiedRooms: newCount }),
            });

            if (res.ok) {
                setCount(newCount);
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => updateStats(count - 1)}
                disabled={loading || count <= 0}
            >
                <Minus className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={() => updateStats(count + 1)}
                disabled={loading || count >= total}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}
