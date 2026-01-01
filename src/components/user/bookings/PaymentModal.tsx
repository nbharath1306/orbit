'use client';

import { useState } from 'react';
import { AlertCircle, CreditCard, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  bookingId: string;
  amount: number;
  propertyTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaymentModal({
  bookingId,
  amount,
  propertyTitle,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // First, get the payment order from backend
      const orderResponse = await fetch('/api/bookings/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount,
        }),
      });

      if (!orderResponse.ok) {
        const data = await orderResponse.json();
        throw new Error(data.error || 'Failed to create payment order');
      }

      const { orderId, key } = await orderResponse.json();

      // Initialize Razorpay payment
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => {
        const razorpay = (window as any).Razorpay;

        const options = {
          key,
          amount: Math.round(amount * 100), // Convert to paise
          currency: 'INR',
          order_id: orderId,
          handler: async (response: any) => {
            try {
              // Verify payment on backend
              const verifyResponse = await fetch(
                '/api/bookings/verify-payment',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bookingId,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature,
                  }),
                }
              );

              if (!verifyResponse.ok) {
                const data = await verifyResponse.json();
                throw new Error(data.error || 'Payment verification failed');
              }

              setSuccess(true);
              onSuccess?.();

              setTimeout(() => {
                onClose();
              }, 2000);
            } catch (err: any) {
              setError(err.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: '',
            email: '',
          },
          theme: {
            color: '#3b82f6',
          },
        };

        const razorpayInstance = new razorpay(options);
        razorpayInstance.open();
      };

      document.body.appendChild(script);
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Payment Successful!
          </h2>
          <p className="text-zinc-400 mb-4">
            Your payment has been confirmed. The owner will be notified shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Complete Payment</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-zinc-400">Property</label>
            <p className="text-white font-medium">{propertyTitle}</p>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <label className="text-sm text-zinc-400">Amount to Pay</label>
            <p className="text-3xl font-bold text-blue-400">
              ₹{amount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="text-sm text-zinc-400 bg-zinc-800/30 border border-zinc-700 rounded-lg p-3">
            <p>
              Click "Pay Now" to proceed to secure payment via Razorpay. This is
              a non-refundable payment.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
