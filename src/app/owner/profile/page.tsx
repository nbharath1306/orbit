'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Camera, Loader2, Save, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OwnerProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });

  const [verificationStep, setVerificationStep] = useState<'form' | 'otp' | null>(null);
  const [otp, setOtp] = useState('');
  const [emailChanged, setEmailChanged] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: (session.user as any).phone || '',
        address: (session.user as any).address || '',
        avatar: session.user.image || '',
      });
    }
  }, [session]);

  const handleAvatarChange = (seed: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    setFormData(prev => ({ ...prev, avatar: newAvatar }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email changed
    const emailHasChanged = formData.email !== session?.user?.email;
    
    if (emailHasChanged) {
      // Send OTP to new email
      setSaving(true);
      try {
        const res = await fetch('/api/owner/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });

        if (res.ok) {
          setPendingData(formData);
          setEmailChanged(true);
          setVerificationStep('otp');
          setMessage({ type: 'success', text: 'OTP sent to your new email address!' });
        } else {
          const data = await res.json();
          setMessage({ type: 'error', text: data.error || 'Failed to send OTP' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to send OTP' });
      } finally {
        setSaving(false);
      }
      return;
    }

    // If no email change, proceed with normal update
    await updateProfile(formData);
  };

  const handleVerifyOTP = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/owner/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingData.email, otp }),
      });

      if (res.ok) {
        // OTP verified, now update profile
        await updateProfile(pendingData);
        setVerificationStep(null);
        setEmailChanged(false);
        setOtp('');
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Invalid OTP' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to verify OTP' });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async (data: typeof formData) => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/owner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update session
        if (session) {
          await update({
            user: {
              ...session.user,
              name: data.name,
              email: data.email,
              image: data.avatar,
            },
          });
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const avatarSeeds = ['Felix', 'Aneka', 'Max', 'Luna', 'Oliver', 'Sophie', 'Charlie', 'Bella'];

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/10 hover:border-emerald-500/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent mb-2">
              My Profile
            </h1>
            <p className="text-zinc-400 text-lg">Manage your account information and preferences</p>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl border ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" suppressHydrationWarning>
            {/* Avatar Section */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                Profile Avatar
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.email}`}
                    alt={formData.name}
                    className="w-24 h-24 rounded-full ring-4 ring-emerald-500/30 bg-zinc-900"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-400 mb-3">Choose an avatar style:</p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {avatarSeeds.map((seed) => (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => handleAvatarChange(seed)}
                        className="w-12 h-12 rounded-full ring-2 ring-white/10 hover:ring-emerald-500/50 transition-all hover:scale-110"
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                          alt={seed}
                          className="w-full h-full rounded-full"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-900/60 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-900/60 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) {
                      setFormData(prev => ({ ...prev, phone: value }));
                    }
                  }}
                  className="w-full px-4 py-3 bg-zinc-900/60 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="9876543210"
                  maxLength={10}
                />
                <p className="text-xs text-zinc-500">Indian format (10 digits)</p>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-900/60 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Your address"
                />
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6">
              <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Account Type:</span>
                  <span className="ml-2 text-white font-semibold">Property Owner</span>
                </div>
                <div>
                  <span className="text-zinc-500">Member Since:</span>
                  <span className="ml-2 text-white font-semibold">
                    {(session?.user as any)?.createdAt 
                      ? new Date((session?.user as any)?.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Recently'}
                  </span>
                </div>
              </div>
            </div>

            {/* OTP Verification Modal */}
            {verificationStep === 'otp' && (
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-4">Email Verification Required</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  We've sent a verification code to <span className="text-white font-semibold">{pendingData?.email}</span>. 
                  Please enter the code below to verify your new email address.
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-zinc-900/60 border border-blue-500/30 rounded-xl text-white text-center text-2xl tracking-widest placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationStep(null);
                        setOtp('');
                        setEmailChanged(false);
                      }}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={otp.length !== 6 || saving}
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {saving ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/owner/dashboard')}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
