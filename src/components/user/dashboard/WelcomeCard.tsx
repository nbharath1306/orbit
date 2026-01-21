'use client';

import React, { useEffect, useState } from 'react';

interface WelcomeCardProps {
  userName: string;
  userAvatar?: string;
  lastLoginDate?: Date | string;
  newNotifications: number;
  nextBookingDate?: string;
  nextBookingProperty?: string;
  onQuickAction?: (action: string) => void;
}

export default function WelcomeCard({
  userName,
  userAvatar,
  lastLoginDate,
  newNotifications,
  nextBookingDate,
  nextBookingProperty,
}: WelcomeCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    if (!mounted) return 'Welcome';
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getLastLoginText = () => {
    if (!mounted || !lastLoginDate) return '';
    const now = new Date();
    const loginDate = typeof lastLoginDate === 'string' ? new Date(lastLoginDate) : lastLoginDate;
    const diff = now.getTime() - loginDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

    if (days > 0) return `Last login: ${days}d ago`;
    if (hours > 0) return `Last login: ${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 lg:p-8 mb-8">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        {/* Left Side */}
        <div className="flex items-start gap-3 sm:gap-4">
          <img
            src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
            alt={userName}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-blue-500/30 flex-shrink-0 ring-2 ring-blue-500/20"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">
              {getGreeting()}, {userName}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">{getLastLoginText()}</p>
            {newNotifications > 0 && (
              <p className="text-xs sm:text-sm font-medium text-blue-400 mt-2">
                ✨ {newNotifications} new {newNotifications === 1 ? 'notification' : 'notifications'}
              </p>
            )}
          </div>
        </div>

        {/* Right Side - Next Booking */}
        {nextBookingDate && nextBookingProperty && (
          <div className="bg-zinc-800/50 rounded-xl p-3 sm:p-4 border border-white/10">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">
              Next Booking
            </p>
            <p className="text-base sm:text-lg font-bold text-white">{nextBookingDate}</p>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 truncate">{nextBookingProperty}</p>
          </div>
        )}
      </div>
    </div>
  );
}
