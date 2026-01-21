'use client';


import { X, MapPin, Clock } from 'lucide-react';
import { BookingItem } from './BookingList';

interface BookingDetailsModalProps {
  booking: BookingItem | null;
  onClose: () => void;
}

export default function BookingDetailsModal({
  booking,
  onClose,
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
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
        return '❌ Cancelled';
      default:
        return status.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 border-b border-white/5 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Booking Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Property Section */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Property Information
              </h3>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-3">
                <div>
                  <p className="text-lg font-bold text-white">
                    {booking.propertyId.title}
                  </p>
                  {booking.propertyId.location && (
                    <div className="flex items-start gap-2 text-zinc-400 text-sm mt-2">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{booking.propertyId.location.address}</span>
                    </div>
                  )}
                </div>
                {booking.propertyId.images?.[0] && (
                  <img
                    src={booking.propertyId.images[0]}
                    alt={booking.propertyId.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* Owner Section */}
            {booking.ownerId && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                  Owner Information
                </h3>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {booking.ownerId.image && (
                      <img
                        src={booking.ownerId.image}
                        alt={booking.ownerId.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-white">
                        {booking.ownerId.name}
                      </p>
                      <p className="text-sm text-zinc-400">Property Owner</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reservation Status */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Reservation Status
              </h3>
              <div className={`rounded-2xl border p-4 ${getStatusBadgeColor(booking.status)}`}>
                <p className="font-semibold text-lg">
                  {getStatusLabel(booking.status)}
                </p>
              </div>
            </div>

            {/* Financial Details */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-zinc-400 text-sm mb-2">Amount Booked</p>
                  <p className="text-2xl font-bold text-white">
                    ₹{(booking.amountPaid / 100).toFixed(0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-zinc-400 text-sm mb-2">Payment Status</p>
                  <p className="text-sm font-semibold text-blue-400">
                    {booking.status === 'pending'
                      ? '⏳ Waiting for Approval'
                      : booking.status === 'paid'
                        ? '✅ Payment Complete'
                        : booking.status === 'confirmed'
                          ? '💰 Ready to Pay'
                          : '❌ Cancelled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Booking Created
                    </p>
                    <p className="text-sm text-zinc-400">
                      {formatDate(booking.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Last Updated
                    </p>
                    <p className="text-sm text-zinc-400">
                      {formatDate(booking.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {booking.updatedAt && (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Clock size={16} />
                  <span>
                    Booking ID: <span className="text-white font-mono">{booking._id}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-white/5 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
