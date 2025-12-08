'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, User, DollarSign, MessageSquare, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';

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
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'confirmed', 'paid'].includes(booking.status);
    if (filter === 'completed') return booking.status === 'confirmed';
    if (filter === 'cancelled') return booking.status === 'rejected';
    return true;
  });

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
        return '⏳ Pending';
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
                  onClick={() => onBookingClick?.(booking._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 rounded-lg transition-all font-medium text-sm"
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
                {booking.status === 'pending' && (
                  <button
                    onClick={() => onDelete?.(booking._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-all font-medium text-sm"
                  >
                    <Trash2 size={16} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
