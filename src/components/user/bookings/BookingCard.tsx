'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, User, CreditCard, X, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface Booking {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    slug: string;
    location: { address: string };
    media: { images: string[] };
  };
  ownerId: {
    name: string;
    email: string;
  };
  status: string;
  paymentStatus: string;
  checkInDate: string;
  durationMonths: number;
  monthlyRent: number;
  totalAmount: number;
  amountPaid: number;
  createdAt: string;
  ownerResponse?: {
    status: string;
    message: string;
    respondedAt: string;
  };
}

export default function BookingCard({ booking: initialBooking }: { booking: Booking }) {
  const [booking, setBooking] = useState(initialBooking);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    'checked-in': 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const paymentStatusColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/bookings/${booking._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: cancelReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      setBooking(data.booking);
      toast.success('Booking cancelled successfully');
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Create Razorpay order
      const orderResponse = await fetch('/api/bookings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Initialize Razorpay (mock for now)
      toast.success('Payment gateway opened (mock)');

      // In production, integrate actual Razorpay:
      // const options = {
      //   key: orderData.keyId,
      //   amount: orderData.amount * 100,
      //   currency: orderData.currency,
      //   name: 'Orbit',
      //   description: `Booking for ${booking.propertyId.title}`,
      //   order_id: orderData.orderId,
      //   handler: async (response: any) => {
      //     // Verify payment
      //     const verifyResponse = await fetch('/api/bookings/payment', {
      //       method: 'PATCH',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({
      //         bookingId: booking._id,
      //         razorpayPaymentId: response.razorpay_payment_id,
      //         razorpayOrderId: response.razorpay_order_id,
      //         razorpaySignature: response.razorpay_signature,
      //       }),
      //     });
      //     
      //     const verifyData = await verifyResponse.json();
      //     if (verifyResponse.ok) {
      //       toast.success('Payment successful!');
      //       setBooking(verifyData.booking);
      //     }
      //   },
      // };
      // 
      // const razorpay = new window.Razorpay(options);
      // razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const needsPayment = booking.paymentStatus === 'pending';

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex gap-4">
          {/* Property Image */}
          <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={booking.propertyId.media.images[0] || '/placeholder.jpg'}
              alt={booking.propertyId.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Booking Details */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{booking.propertyId.title}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {booking.propertyId.location.address}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className={statusColors[booking.status] || ''}>
                  {booking.status.replace('-', ' ').toUpperCase()}
                </Badge>
                <Badge className={paymentStatusColors[booking.paymentStatus] || ''}>
                  {booking.paymentStatus.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Check-in</p>
                  <p className="font-medium">{format(new Date(booking.checkInDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Owner</p>
                  <p className="font-medium">{booking.ownerId.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-medium">₹{booking.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium">{booking.durationMonths} months</p>
                </div>
              </div>
            </div>

            {/* Owner Response */}
            {booking.ownerResponse && (
              <div className={`p-3 rounded-lg ${booking.ownerResponse.status === 'accepted'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  {booking.ownerResponse.status === 'accepted' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium text-sm">
                    {booking.ownerResponse.status === 'accepted' ? 'Accepted' : 'Rejected'} by Owner
                  </span>
                </div>
                {booking.ownerResponse.message && (
                  <p className="text-sm text-gray-700">{booking.ownerResponse.message}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {needsPayment && booking.status !== 'cancelled' && (
                <Button onClick={handlePayment} disabled={loading} size="sm">
                  Pay Now
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={loading}
                  size="sm"
                >
                  Cancel Booking
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <a href={`/properties/${booking.propertyId.slug}`}>View Property</a>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Please provide a reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={loading}>
              {loading ? 'Cancelling...' : 'Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
