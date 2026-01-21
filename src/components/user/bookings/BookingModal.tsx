'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ApprovalPendingModal from './ApprovalPendingModal';

interface BookingModalProps {
  property: {
    _id: string;
    title: string;
    price: {
      amount: number;
      period: string;
    };
    liveStats: {
      totalRooms: number;
      occupiedRooms: number;
    };
  };
  trigger?: React.ReactNode;
}

const ROOM_TYPES = [
  { value: 'single', label: '🏠 Single Occupancy', icon: '1️⃣' },
  { value: 'double', label: '👥 Double Occupancy', icon: '2️⃣' },
  { value: 'triple', label: '👨‍👩‍👧 Triple Occupancy', icon: '3️⃣' },
  { value: 'quad', label: '👨‍👩‍👧‍👦 Quad Occupancy', icon: '4️⃣' },
];

const DURATIONS = [
  { value: 1, label: '1 Month' },
  { value: 2, label: '2 Months' },
  { value: 3, label: '3 Months' },
  { value: 4, label: '4 Months' },
  { value: 5, label: '5 Months' },
  { value: 6, label: '6 Months (Half Year)' },
  { value: 9, label: '9 Months (Semester)' },
  { value: 12, label: '12 Months (Full Year)' },
];

export default function BookingModal({ property, trigger }: BookingModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form
  const [mounted, setMounted] = useState(false);
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);
  const [reservationAmount, setReservationAmount] = useState(0);
  const [roomAvailability, setRoomAvailability] = useState<Record<string, { total: number; booked: number }> | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const modalContentRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    checkInDate: '',
    durationMonths: 3,
    guestCount: 1,
    roomType: 'single',
    specialRequests: '',
  });

  // Fetch room availability and prevent background scroll
  useEffect(() => {
    setMounted(true);

    // Fetch availability
    const fetchAvailability = async () => {
      try {
        const response = await fetch(`/api/properties/availability?propertyId=${property._id}`);
        if (response.ok) {
          const data = await response.json();
          setRoomAvailability(data.availability);
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      }
    };

    fetchAvailability();

    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, property._id]);

  const availableRooms = property.liveStats.totalRooms - property.liveStats.occupiedRooms;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'durationMonths' || name === 'guestCount' ? parseInt(value) : value,
    }));
  };

  const calculateTotal = () => {
    const monthlyRent = property.price.amount;
    const securityDeposit = monthlyRent;
    const totalRent = monthlyRent * formData.durationMonths;
    return {
      monthlyRent,
      securityDeposit,
      totalRent,
      grandTotal: totalRent + securityDeposit,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.checkInDate) {
      toast.error('📅 Please select a check-in date to continue', { duration: 3000 });
      return;
    }

    const checkInDate = new Date(formData.checkInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      toast.error('⏰ Check-in date must be today or in the future', { duration: 3000 });
      return;
    }

    // If step 1, move to step 2 for confirmation
    if (step === 1) {
      setStep(2);
      return;
    }

    // Step 2 - Create booking
    setLoading(true);
    setErrorMessage(''); // Clear any previous errors

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id,
          ...formData,
        }),
      });

      const data = await response.json();

      console.log('Booking API response:', {
        ok: response.ok,
        status: response.status,
        data
      });

      if (!response.ok) {
        setLoading(false);

        // Show error INSIDE the modal
        const errorMsg = data.error || 'Failed to create booking. Please try again.';

        console.log('Booking blocked:', errorMsg);

        // Handle specific error cases with better messages
        if (errorMsg.includes('already have an active booking')) {
          setErrorMessage('🚫 You already have an active booking for this property. Please complete or cancel your existing booking first before booking again.');
          // Scroll to top to show error
          modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          return; // Keep modal open

        } else if (errorMsg.includes('fully booked')) {
          setErrorMessage('🔒 Sorry, this property is fully booked for the selected period. Please try different dates or check other properties.');
          // Scroll to top to show error
          modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          return; // Keep modal open
        } else {
          setErrorMessage(errorMsg);
          // Scroll to top to show error
          modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          return; // Keep modal open
        }
      }

      // Success case
      toast.success(
        `🎉 Booking confirmed! Your reservation for ${property.title} has been created.`,
        {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: '600',
            padding: '20px 24px',
            borderRadius: '16px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            maxWidth: '550px',
          },
          position: 'top-center',
        }
      );

      // Calculate and show approval message
      const monthlyRent = property.price.amount;
      const totalRent = monthlyRent * formData.durationMonths;
      const securityDeposit = monthlyRent;
      const totalAmount = totalRent + securityDeposit;

      // Show success toast
      toast.success(
        `🎉 Booking request submitted for ${property.title}! The owner will review your request shortly.`,
        { duration: 5000 }
      );

      setReservationAmount(totalAmount);
      setShowApprovalMessage(true);
      setOpen(false);
      setStep(1);

      // Reset form
      setFormData({
        checkInDate: '',
        durationMonths: 3,
        guestCount: 1,
        roomType: 'single',
        specialRequests: '',
      });

      // Redirect to booking details after modal closes
      setTimeout(() => {
        router.push(`/dashboard/bookings?new=${data.booking._id}`);
      }, 2000);
    } catch (error) {
      console.error('Booking error:', error);
      // Don't show error toast here if we already handled it above
      if (error instanceof Error && !error.message.includes('already have an active booking')) {
        toast.error(
          error.message || 'Unable to create booking. Please check your connection and try again.',
          { duration: 4000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const costs = calculateTotal();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button size="lg" disabled={availableRooms === 0} className="w-full">
              {availableRooms === 0 ? 'Fully Booked' : 'Reserve Room'}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Reserve {property.title}</DialogTitle>
            <DialogDescription>
              Step {step} of 2 - {step === 1 ? 'Select dates & duration' : 'Confirm details'}
            </DialogDescription>
          </DialogHeader>

          <div ref={modalContentRef} className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">

              {/* Error Message Display */}
              {errorMessage && (
                <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-5 mb-4 animate-pulse">
                  <p className="text-red-400 font-semibold text-center text-lg leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              )}

              {step === 1 ? (
                <>
                  {/* Check-in Date */}
                  <div className="space-y-3">
                    <Label htmlFor="checkInDate" className="text-white font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Check-in Date *
                    </Label>
                    {mounted && (
                      <input
                        type="date"
                        id="checkInDate"
                        name="checkInDate"
                        value={formData.checkInDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* Duration */}
                  <div className="space-y-3">
                    <Label htmlFor="durationMonths" className="text-white font-semibold">
                      📅 Duration *
                    </Label>
                    <select
                      id="durationMonths"
                      name="durationMonths"
                      value={formData.durationMonths}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      {DURATIONS.map((dur) => (
                        <option key={dur.value} value={dur.value}>
                          {dur.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Type */}
                  <div className="space-y-3">
                    <Label className="text-white font-semibold">🏠 Room Type *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {ROOM_TYPES.map((room) => {
                        const availability = roomAvailability?.[room.value as keyof typeof roomAvailability];
                        const isAvailable = availability && availability.total > availability.booked;
                        const availableCount = availability ? availability.total - availability.booked : 0;

                        return (
                          <button
                            key={room.value}
                            type="button"
                            onClick={() => {
                              if (isAvailable) {
                                setFormData((prev) => ({ ...prev, roomType: room.value }));
                              }
                            }}
                            disabled={!isAvailable}
                            className={`p-3 rounded-lg border-2 transition-all ${!isAvailable
                                ? 'border-red-500/30 bg-red-500/5 opacity-50 cursor-not-allowed'
                                : formData.roomType === room.value
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                              }`}
                          >
                            <div className={`text-2xl mb-1 ${!isAvailable ? 'line-through opacity-50' : ''}`}>
                              {room.icon}
                            </div>
                            <div className={`text-sm font-medium ${!isAvailable ? 'text-red-400 line-through' : 'text-white'}`}>
                              {room.label}
                            </div>
                            {availability && (
                              <div className={`text-xs mt-1 ${!isAvailable ? 'text-red-400' : 'text-zinc-400'}`}>
                                {isAvailable ? `${availableCount} available` : 'Fully Booked'}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guest Count */}
                  <div className="space-y-3">
                    <Label htmlFor="guestCount" className="text-white font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Number of Guests *
                    </Label>
                    <input
                      type="number"
                      id="guestCount"
                      name="guestCount"
                      value={formData.guestCount}
                      onChange={handleInputChange}
                      min="1"
                      max="4"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Review Summary */}
                  <div className="space-y-4">
                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                      <h3 className="text-white font-bold mb-3">📋 Booking Summary</h3>
                      <div className="space-y-2 text-sm text-zinc-300">
                        <div className="flex justify-between">
                          <span>Check-in:</span>
                          <span className="text-white font-medium">{new Date(formData.checkInDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="text-white font-medium">{formData.durationMonths} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Room Type:</span>
                          <span className="text-white font-medium">{ROOM_TYPES.find(r => r.value === formData.roomType)?.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Guests:</span>
                          <span className="text-white font-medium">{formData.guestCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 p-4 rounded-lg">
                      <h3 className="text-white font-bold mb-3">💰 Cost Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-zinc-300">
                          <span>Monthly Rent:</span>
                          <span>₹{costs.monthlyRent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>×{formData.durationMonths} months:</span>
                          <span>₹{costs.totalRent.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-blue-500/30 pt-2 mt-2 flex justify-between text-zinc-300">
                          <span>Security Deposit (Refundable):</span>
                          <span>₹{costs.securityDeposit.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-blue-500/30 pt-2 mt-2 flex justify-between text-white font-bold text-lg">
                          <span>Total Amount:</span>
                          <span className="text-blue-400">₹{costs.grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-3">* Security deposit will be refunded after check-out</p>
                    </div>

                    {/* Special Requests */}
                    <div className="space-y-2">
                      <Label htmlFor="specialRequests" className="text-white font-semibold">
                        Special Requests (Optional)
                      </Label>
                      <Textarea
                        id="specialRequests"
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        placeholder="e.g., Ground floor preferred, need parking space..."
                        maxLength={500}
                        rows={3}
                        className="resize-none bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-zinc-400">
                        {formData.specialRequests.length}/500 characters
                      </p>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-zinc-700 p-6 flex gap-3">
            {step === 2 && (
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button
                onClick={() => setStep(2)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!formData.checkInDate}
              >
                Continue
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm Reservation'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Pending Message Modal */}
      <ApprovalPendingModal
        open={showApprovalMessage}
        onClose={() => setShowApprovalMessage(false)}
        propertyTitle={property.title}
        totalAmount={reservationAmount}
      />
    </>
  );
}
