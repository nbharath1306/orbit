'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, User, DollarSign, MessageSquare, Eye, Trash2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import BookingDetailsModal from './BookingDetailsModal';
import PaymentModal from './PaymentModal';

export interface BookingItem {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    slug: string;
    location?: {
      address: string;
    };
    images?: string[];
  };
  ownerId?: {
    _id: string;
    name: string;
    image?: string;
  };
  status: 'pending' | 'paid' | 'confirmed' | 'rejected';
  amountPaid: number;
  createdAt: string;
  updatedAt: string;
}

interface BookingListProps {
  bookings: BookingItem[];
  filter?: 'active' | 'completed' | 'cancelled' | 'all';
  onBookingClick?: (bookingId: string) => void;
  onDelete?: (bookingId: string) => void;
}

export default function BookingList({
  bookings,
  filter = 'all',
  onBookingClick,
  onDelete,
}: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<BookingItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'confirmed', 'paid'].includes(booking.status);
    if (filter === 'completed') return booking.status === 'confirmed';
    if (filter === 'cancelled') return booking.status === 'rejected';
    return true;
  });

  const handleDetailsClick = (booking: BookingItem) => {
    setSelectedBooking(booking);
    onBookingClick?.(booking._id);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b._id === bookingId);
    
    if (!booking) {
      setToastMessage({
        text: 'Booking not found',
        type: 'error',
      });
      return;
    }

    // Check if already cancelled
    if (booking.status === 'rejected') {
      setToastMessage({
        text: 'This booking has already been cancelled',
        type: 'error',
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // Check if confirmed (can't cancel confirmed)
    if (booking.status === 'confirmed') {
      setToastMessage({
        text: 'Cannot cancel confirmed bookings. Please contact the owner.',
        type: 'error',
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const confirmMessage = booking.status === 'paid' 
      ? 'Are you sure? Payment has been made. Cancelling will process a refund.\n\nThis action cannot be undone.'
      : 'Are you sure you want to cancel this booking?\n\nThis action cannot be undone.';

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      setToastMessage({
        text: 'Booking cancelled successfully',
        type: 'success',
      });

      onDelete?.(bookingId);

      // Auto-hide toast
      setTimeout(() => setToastMessage(null), 3000);

      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error('Cancel error:', error);
      setToastMessage({
        text: error.message || 'Failed to cancel booking',
        type: 'error',
      });

      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30';
      case 'paid':
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30';
      case 'confirmed':
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30';
      case 'rejected':
        return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800/50 text-zinc-400 border-white/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Waiting for Approval';
      case 'paid':
        return '💰 Paid';
      case 'confirmed':
        return '✅ Confirmed';
      case 'rejected':
        return '❌ Rejected';
      default:
        return status.toUpperCase();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (filteredBookings.length === 0) {
    return (
      <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative z-10">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Bookings Yet</h3>
          <p className="text-zinc-400 mb-4">
            {filter === 'all'
              ? 'You haven\'t made any bookings yet.'
              : `No ${filter} bookings found.`}
          </p>
          <Link
            href="/search"
            className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all hover:shadow-lg hover:shadow-purple-500/50"
          >
            Start Searching
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredBookings.map((booking) => (
        <div
          key={booking._id}
          className="relative group rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 hover:border-white/10 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6">
            {/* Property Image */}
            <div className="w-full md:w-48 h-40 rounded-2xl bg-zinc-800/50 overflow-hidden flex-shrink-0 border border-white/5">
              {booking.propertyId.images?.[0] ? (
                <img
                  src={booking.propertyId.images[0]}
                  alt={booking.propertyId.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800 text-white">
                  📷
                </div>
              )}
            </div>

            {/* Booking Details */}
            <div className="flex-1 flex flex-col justify-between">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {booking.propertyId.title}
                    </h3>
                    {booking.propertyId.location && (
                      <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                        <MapPin size={16} />
                        {booking.propertyId.location.address}
                      </div>
                    )}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {getStatusLabel(booking.status)}
                  </div>
                </div>

                {/* Approval Pending Message */}
                {booking.status === 'pending' && (
                  <div className="mb-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-2">
                    <span className="text-yellow-400 font-semibold text-lg">⏳</span>
                    <div>
                      <p className="text-sm font-semibold text-yellow-100">Waiting for Owner Approval</p>
                      <p className="text-xs text-yellow-200/70 mt-1">The owner will review your request within 24 hours. You'll be able to make the payment once approved.</p>
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1">
                      Booked On
                    </p>
                    <p className="font-semibold text-white">{formatDate(booking.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1">
                      Amount
                    </p>
                    <p className="font-semibold text-white">₹{(booking.amountPaid / 100).toFixed(2)}</p>
                  </div>
                  {booking.ownerId && (
                    <div>
                      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1">
                        Owner
                      </p>
                      <p className="font-semibold text-white">{booking.ownerId.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1">
                      Updated
                    </p>
                    <p className="font-semibold text-white">{formatDate(booking.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleDetailsClick(booking)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <Eye size={16} />
                  Details
                </button>
                <Link
                  href={`/dashboard/messages?owner=${booking.ownerId?._id || ''}`}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/30 rounded-lg transition-all font-medium text-sm"
                >
                  <MessageSquare size={16} />
                  Message Owner
                </Link>
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => setPaymentBooking(booking)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30 rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CreditCard size={16} />
                    Pay Now
                  </button>
                )}
                {['pending', 'paid'].includes(booking.status) && (
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                    {isLoading ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 max-w-sm px-6 py-4 rounded-2xl font-medium text-white backdrop-blur-md border transition-all shadow-2xl ${
            toastMessage.type === 'success'
              ? 'bg-green-500/20 border-green-500/30 text-green-100'
              : 'bg-red-500/20 border-red-500/30 text-red-100'
          }`}
        >
          <p className="text-sm">{toastMessage.text}</p>
        </div>
      )}

      {/* Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      {/* Payment Modal */}
      {paymentBooking && (
        <PaymentModal
          bookingId={paymentBooking._id}
          amount={Math.ceil((paymentBooking.amountPaid || 0) / 100)}
          propertyTitle={paymentBooking.propertyId.title}
          onClose={() => setPaymentBooking(null)}
          onSuccess={() => {
            setToastMessage({
              text: 'Payment successful! Reloading...',
              type: 'success',
            });
            setTimeout(() => window.location.reload(), 1500);
          }}
        />
      )}
    </div>
  );
}
