'use client';

import React from 'react';
import { Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApprovalPendingModalProps {
  open: boolean;
  onClose: () => void;
  propertyTitle: string;
  totalAmount: number;
}

export default function ApprovalPendingModal({
  open,
  onClose,
  propertyTitle,
  totalAmount,
}: ApprovalPendingModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-md w-full rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 overflow-hidden shadow-2xl">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5 opacity-50" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <X size={20} className="text-zinc-400" />
        </button>

        {/* Content */}
        <div className="relative z-10 p-8 text-center">
          {/* Animated waiting icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-yellow-500/20 blur-xl animate-pulse" />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                <Clock size={40} className="text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>

          {/* Main heading */}
          <h2 className="text-2xl font-bold text-white mb-2">
            🎉 Reservation Request Submitted!
          </h2>

          {/* Property name */}
          <p className="text-zinc-400 mb-6 text-sm">
            Your reservation request for <span className="text-white font-semibold">{propertyTitle}</span> has been submitted successfully.
          </p>

          {/* Waiting for approval message */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold text-white mb-2">⏳ Waiting for Owner Approval</h3>
                <p className="text-sm text-zinc-300">
                  The property owner will review your request and get back to you shortly. You&apos;ll be notified as soon as your reservation is approved.
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-green-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Reservation Submitted</p>
                <p className="text-xs text-zinc-500">Just now</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                <Clock size={18} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Owner Reviews Request</p>
                <p className="text-xs text-zinc-500">Usually within 24 hours</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-blue-400 text-sm font-bold">3</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Make Payment</p>
                <p className="text-xs text-zinc-500">Complete payment after approval</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <span className="text-purple-400 text-sm font-bold">4</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Booking Confirmed</p>
                <p className="text-xs text-zinc-500">Move in on your check-in date</p>
              </div>
            </div>
          </div>

          {/* Amount info */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
            <p className="text-zinc-400 text-sm mb-1">Reservation Amount</p>
            <p className="text-2xl font-bold text-blue-400">₹{totalAmount.toLocaleString('en-IN')}</p>
            <p className="text-xs text-zinc-500 mt-2">You&apos;ll make this payment after the owner approves your request</p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 rounded-lg transition-all"
            >
              Got It! Go to Dashboard
            </Button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>

          {/* Help text */}
          <p className="text-xs text-zinc-500 mt-4">
            Have questions? Check your email or message the property owner from your bookings.
          </p>
        </div>
      </div>
    </div>
  );
}
