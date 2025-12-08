import React from 'react';

// Generic skeleton loader
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-zinc-700/30 rounded ${className}`}
      role="status"
      aria-label="Loading..."
    />
  );
}

// Dashboard stats loading
export function DashboardStatsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-4 lg:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <Skeleton className="w-16 h-6 rounded" />
            </div>
            <Skeleton className="w-24 h-8 rounded mb-2" />
            <Skeleton className="w-32 h-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Booking card loading
export function BookingCardLoading() {
  return (
    <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-4 lg:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row gap-4">
        {/* Image skeleton */}
        <Skeleton className="w-full sm:w-32 h-32 rounded-lg flex-shrink-0" />
        
        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <Skeleton className="w-48 h-6 rounded" />
            <Skeleton className="w-20 h-6 rounded-full" />
          </div>
          <Skeleton className="w-full h-4 rounded mb-2" />
          <Skeleton className="w-3/4 h-4 rounded mb-4" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="w-24 h-8 rounded-lg" />
            <Skeleton className="w-24 h-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Booking list loading
export function BookingListLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <BookingCardLoading key={i} />
      ))}
    </div>
  );
}

// Profile card loading
export function ProfileCardLoading() {
  return (
    <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 lg:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 text-center sm:text-left space-y-3">
            <Skeleton className="w-48 h-8 rounded mx-auto sm:mx-0" />
            <Skeleton className="w-64 h-4 rounded mx-auto sm:mx-0" />
            <Skeleton className="w-32 h-6 rounded-full mx-auto sm:mx-0" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-24 h-4 rounded" />
              <Skeleton className="w-full h-6 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Activity feed loading
export function ActivityFeedLoading() {
  return (
    <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-4 lg:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10">
        <Skeleton className="w-40 h-6 rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-b-0">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-full h-4 rounded" />
                <Skeleton className="w-3/4 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Welcome card loading
export function WelcomeCardLoading() {
  return (
    <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 lg:p-8 mb-6 lg:mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-3 flex-1">
          <Skeleton className="w-64 h-8 rounded bg-zinc-700/50" />
          <Skeleton className="w-96 h-5 rounded bg-zinc-700/50" />
        </div>
        <Skeleton className="w-32 h-10 rounded-lg bg-zinc-700/50" />
      </div>
    </div>
  );
}

// Quick actions loading
export function QuickActionsLoading() {
  return (
    <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-4 lg:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10">
        <Skeleton className="w-32 h-6 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-full h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Full page loading
export function DashboardPageLoading() {
  return (
    <div className="p-4 lg:p-8 animate-fadeIn">
      <WelcomeCardLoading />
      <DashboardStatsLoading />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActionsLoading />
        <ActivityFeedLoading />
      </div>
    </div>
  );
}

export default Skeleton;
