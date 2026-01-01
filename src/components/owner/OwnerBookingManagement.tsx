'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, DollarSign, MessageSquare } from 'lucide-react';

interface BookingRequest {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  propertyId: {
    _id: string;
    title: string;
  };
  status: 'pending' | 'confirmed' | 'rejected' | 'paid' | 'completed';
  amountPaid: number;
  checkInDate: string;
  createdAt: string;
  updatedAt: string;
}

interface OwnerBookingManagementProps {
  propertyId?: string;
}

export default function OwnerBookingManagement({
  propertyId,
}: OwnerBookingManagementProps) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadBookings();
  }, [propertyId]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/owner/bookings?filter=pending');
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const response = await fetch('/api/owner/bookings/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept booking');
      }

      showToast('Booking accepted! Waiting for student payment', 'success');
      loadBookings();
    } catch (error: any) {
      showToast(error.message || 'Failed to accept booking', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to reject this booking?')) return;

    setActionLoading(bookingId);
    try {
      const response = await fetch('/api/owner/bookings/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject booking');
      }

      showToast('Booking rejected', 'success');
      loadBookings();
    } catch (error: any) {
      showToast(error.message || 'Failed to reject booking', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800/50 text-zinc-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Awaiting Your Response';
      case 'confirmed':
        return '✅ Accepted - Waiting for Payment';
      case 'paid':
        return '💰 Payment Received';
      case 'completed':
        return '🎉 Move-in Complete';
      case 'rejected':
        return '❌ Rejected';
      default:
        return status.toUpperCase();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-zinc-400">
        Loading booking requests...
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const paidBookings = bookings.filter((b) => b.status === 'paid');

  return (
    <div className="space-y-6">
      {/* Pending Requests - Owner Action Required */}
      {pendingBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="text-yellow-400" size={20} />
            Pending Booking Requests ({pendingBookings.length})
          </h3>
          <div className="space-y-3">
            {pendingBookings.map((booking) => (
              <div
                key={booking._id}
                className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 hover:border-yellow-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-white">{booking.studentId.name}</p>
                    <p className="text-sm text-zinc-400">{booking.studentId.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-zinc-400 text-xs">Property</p>
                    <p className="text-white font-medium">{booking.propertyId.title}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-xs">Check-in Date</p>
                    <p className="text-white font-medium">
                      {new Date(booking.checkInDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Owner Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAcceptBooking(booking._id)}
                    disabled={actionLoading === booking._id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-colors disabled:opacity-50 font-medium"
                  >
                    <Check size={16} />
                    {actionLoading === booking._id ? 'Accepting...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleRejectBooking(booking._id)}
                    disabled={actionLoading === booking._id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50 font-medium"
                  >
                    <X size={16} />
                    {actionLoading === booking._id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed - Waiting for Payment */}
      {confirmedBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="text-blue-400" size={20} />
            Awaiting Payment ({confirmedBookings.length})
          </h3>
          <div className="space-y-3">
            {confirmedBookings.map((booking) => (
              <div
                key={booking._id}
                className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-white">{booking.studentId.name}</p>
                    <p className="text-sm text-zinc-400">You accepted this booking</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
                <p className="text-sm text-blue-300">
                  ⏳ Waiting for student to complete payment to confirm move-in
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paid - Ready for Move-in */}
      {paidBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="text-green-400" size={20} />
            Payment Confirmed ({paidBookings.length})
          </h3>
          <div className="space-y-3">
            {paidBookings.map((booking) => (
              <div
                key={booking._id}
                className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-white">{booking.studentId.name}</p>
                    <p className="text-sm text-zinc-400">Payment received</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors font-medium">
                    <MessageSquare size={16} />
                    Message Student
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {bookings.length === 0 && (
        <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Booking Requests</h3>
          <p className="text-zinc-400">
            You don't have any pending booking requests. Check back later!
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg font-medium text-white border transition-all ${
            toast.type === 'success'
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
