'use client';


import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import BookingList, { BookingItem } from './BookingList';

interface BookingsPageContentProps {
  initialBookings: BookingItem[];
}

export default function BookingsPageContent({ initialBookings }: BookingsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = (searchParams.get('filter') || 'all') as 'all' | 'active' | 'completed' | 'cancelled';

  const getFilteredBookings = (filter: string) => {
    if (filter === 'all') return initialBookings;
    if (filter === 'active') return initialBookings.filter((b) => ['pending', 'confirmed', 'paid'].includes(b.status));
    if (filter === 'completed') return initialBookings.filter((b) => b.status === 'confirmed');
    if (filter === 'cancelled') return initialBookings.filter((b) => b.status === 'rejected');
    return initialBookings;
  };

  const filteredBookings = getFilteredBookings(currentFilter);
  const activeCount = initialBookings.filter((b) => ['pending', 'confirmed', 'paid'].includes(b.status)).length;
  const completedCount = initialBookings.filter((b) => b.status === 'confirmed').length;
  const cancelledCount = initialBookings.filter((b) => b.status === 'rejected').length;

  const handleFilterChange = (filter: string) => {
    router.push(`/dashboard/bookings?filter=${filter}`);
  };

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 sm:gap-4 mb-6 border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 sm:px-4 py-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${currentFilter === 'all'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-blue-400'
            }`}
        >
          All ({initialBookings.length})
        </button>
        <button
          onClick={() => handleFilterChange('active')}
          className={`px-3 sm:px-4 py-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${currentFilter === 'active'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-blue-400'
            }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => handleFilterChange('completed')}
          className={`px-3 sm:px-4 py-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${currentFilter === 'completed'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-blue-400'
            }`}
        >
          Completed ({completedCount})
        </button>
        <button
          onClick={() => handleFilterChange('cancelled')}
          className={`px-3 sm:px-4 py-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${currentFilter === 'cancelled'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-blue-400'
            }`}
        >
          Cancelled ({cancelledCount})
        </button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <BookingList bookings={filteredBookings} filter={currentFilter} />
      ) : (
        <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-zinc-400 text-lg mb-4">
              {currentFilter === 'all'
                ? 'No bookings yet'
                : `No ${currentFilter} bookings found.`}
            </p>
            <Link href="/search">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                Browse Properties
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
