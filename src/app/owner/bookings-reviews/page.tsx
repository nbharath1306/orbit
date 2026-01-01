'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Booking {
  _id: string;
  studentId: {
    name: string;
    email: string;
  };
  propertyId: {
    title: string;
  };
  status: 'pending' | 'confirmed' | 'paid' | 'rejected' | 'cancelled';
  amountPaid?: number;
  createdAt: string;
}

interface Review {
  _id: string;
  studentId?: {
    name: string;
    email: string;
  };
  propertyId: {
    title: string;
  };
  rating: number;
  comment: string;
  isAnonymous?: boolean;
  isVerifiedStay?: boolean;
  createdAt: string;
  ownerResponse?: {
    comment: string;
  };
}

interface Property {
  _id: string;
  title: string;
  averageRating?: number;
  reviewCount?: number;
}

interface BookingStats {
  pending: number;
  confirmed: number;
  totalRevenue: number;
  properties: Property[];
}

export default function OwnerBookingsReviewsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    pending: 0,
    confirmed: 0,
    totalRevenue: 0,
    properties: [],
  });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, reviewsRes] = await Promise.all([
        fetch('/api/owner/bookings?filter=all'),
        fetch('/api/owner/reviews'),
      ]);

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings || []);
        
        // Calculate stats
        const pending = data.bookings?.filter((b: Booking) => b.status === 'pending').length || 0;
        const confirmed = data.bookings?.filter((b: Booking) => b.status === 'confirmed').length || 0;
        const totalRevenue = data.bookings?.reduce((sum: number, b: Booking) => sum + (b.amountPaid || 0), 0) || 0;
        
        setStats(prev => ({ ...prev, pending, confirmed, totalRevenue }));
      }

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }

      // Fetch properties
      const propsRes = await fetch('/api/owner/properties');
      if (propsRes.ok) {
        const data = await propsRes.json();
        setStats(prev => ({ ...prev, properties: data.properties || [] }));
      }
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      const res = await fetch('/api/owner/bookings/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Booking accepted! Student can now proceed with payment', 'success');
        await fetchData();
      } else {
        showToast(data.error || 'Failed to accept booking', 'error');
      }
    } catch (error) {
      showToast('Error accepting booking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      const res = await fetch('/api/owner/bookings/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId,
          reason: rejectionReason[bookingId] || 'Owner declined'
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Booking rejected', 'success');
        setShowRejectModal(null);
        setRejectionReason(prev => {
          const updated = { ...prev };
          delete updated[bookingId];
          return updated;
        });
        await fetchData();
      } else {
        showToast(data.error || 'Failed to reject booking', 'error');
      }
    } catch (error) {
      showToast('Error rejecting booking', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Your Bookings & Reviews</h1>
        <p className="text-zinc-400">Manage all bookings and monitor property feedback</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Properties"
          value={stats.properties.length}
          color="blue"
          icon="🏠"
        />
        <StatCard
          label="Active Bookings"
          value={stats.confirmed}
          color="green"
          icon="📅"
        />
        <StatCard
          label="Pending Bookings"
          value={stats.pending}
          color="orange"
          icon="⏳"
        />
        <StatCard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          color="purple"
          icon="💰"
        />
      </div>

      {/* Bookings Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Booking Requests</h2>
        
        {bookings.length === 0 ? (
          <div className="text-center py-12 border border-white/10 rounded-lg">
            <p className="text-zinc-400">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onAccept={() => handleAcceptBooking(booking._id)}
                onReject={() => setShowRejectModal(booking._id)}
                isProcessing={processingId === booking._id}
                onRejectReasonChange={(reason) =>
                  setRejectionReason(prev => ({ ...prev, [booking._id]: reason }))
                }
                rejectionReason={rejectionReason[booking._id] || ''}
                showRejectModal={showRejectModal === booking._id}
                onCloseRejectModal={() => setShowRejectModal(null)}
                onConfirmReject={() => handleRejectBooking(booking._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Recent Reviews</h2>
        {reviews.length === 0 ? (
          <div className="text-center py-12 border border-white/10 rounded-lg">
            <p className="text-zinc-400">No reviews yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reviews.slice(0, 6).map((review) => (
              <div
                key={review._id}
                className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {review.isAnonymous ? 'Anonymous' : review.studentId?.name}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">{review.propertyId?.title}</p>
                  </div>
                  <span className="text-lg font-bold text-yellow-400">⭐ {review.rating}</span>
                </div>

                <p className="text-sm text-zinc-300 line-clamp-3">{review.comment}</p>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{review.isVerifiedStay && '✓ Verified Stay'}</span>
                  <span>{format(new Date(review.createdAt), 'MMM dd, yyyy')}</span>
                </div>

                {review.ownerResponse && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs font-semibold text-blue-400 mb-1">Your Response:</p>
                    <p className="text-sm text-zinc-300">{review.ownerResponse.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Properties Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Your Properties</h2>
        {stats.properties.length === 0 ? (
          <div className="text-center py-12 border border-white/10 rounded-lg">
            <p className="text-zinc-400">No properties yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.properties.map((prop) => (
              <div
                key={prop._id}
                className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors space-y-3"
              >
                <h3 className="font-semibold text-white">{prop.title}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Rating</span>
                  <span className="text-yellow-400 font-semibold">
                    ⭐ {prop.averageRating ? prop.averageRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Reviews</span>
                  <span className="font-semibold text-white">{prop.reviewCount || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Booking Card Component
function BookingCard({
  booking,
  onAccept,
  onReject,
  isProcessing,
  onRejectReasonChange,
  rejectionReason,
  showRejectModal,
  onCloseRejectModal,
  onConfirmReject,
}: {
  booking: Booking;
  onAccept: () => void;
  onReject: () => void;
  isProcessing: boolean;
  onRejectReasonChange: (reason: string) => void;
  rejectionReason: string;
  showRejectModal: boolean;
  onCloseRejectModal: () => void;
  onConfirmReject: () => void;
}) {
  const isPending = booking.status === 'pending';
  const canManage = isPending || booking.status === 'confirmed';

  return (
    <>
      <div className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Booking Info */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{booking.studentId.name}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  booking.status === 'confirmed'
                    ? 'bg-green-500/20 text-green-400'
                    : booking.status === 'pending'
                    ? 'bg-orange-500/20 text-orange-400'
                    : booking.status === 'rejected'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {booking.status}
              </span>
            </div>
            <p className="text-sm text-zinc-400">{booking.studentId.email}</p>
            <p className="text-sm text-zinc-400">📍 {booking.propertyId.title}</p>
            <p className="text-sm text-zinc-400">
              Amount: <span className="font-semibold text-emerald-400">₹{booking.amountPaid?.toLocaleString() || '0'}</span>
            </p>
            <p className="text-xs text-zinc-500">
              Requested: {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-2 flex-col sm:flex-row">
              <button
                onClick={onAccept}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Accept
              </button>
              <button
                onClick={onReject}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Reject
              </button>
            </div>
          )}

          {booking.status === 'confirmed' && (
            <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              ✓ Awaiting Payment
            </div>
          )}
        </div>

        {/* Info Alert */}
        {isPending && (
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-2 text-sm text-blue-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Once you accept, the student will be notified and can proceed with payment. You'll receive the booking
              confirmation once payment is complete.
            </span>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 rounded-lg p-6 max-w-sm w-full border border-white/10 space-y-4">
            <h3 className="text-lg font-semibold text-white">Reject Booking</h3>
            <p className="text-sm text-zinc-400">
              Are you sure you want to reject this booking from {booking.studentId.name}?
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
              placeholder="Optional: Add a reason for rejection..."
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
              rows={3}
            />

            <div className="flex gap-2">
              <button
                onClick={onCloseRejectModal}
                className="flex-1 px-3 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmReject}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50 transition-all"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
  };

  const textColorMap: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
  };

  return (
    <div
      className={`p-6 rounded-lg border border-white/10 bg-gradient-to-br ${
        colorMap[color]
      } hover:border-white/20 transition-all`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-400">{label}</p>
          <p className={`text-2xl font-bold ${textColorMap[color]}`}>{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
