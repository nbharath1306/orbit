'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, MessageSquare, Star, CheckCircle2, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';

export interface Activity {
  id: string;
  type: 'booking_confirmed' | 'booking_cancelled' | 'review_response' | 'message_received' | 'payment_received' | 'property_liked';
  title: string;
  description: string;
  timestamp: Date | string;
  link?: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  onActivityClick?: (activity: Activity) => void;
}

export default function RecentActivityFeed({
  activities,
  maxItems = 5,
  onActivityClick,
}: RecentActivityFeedProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'booking_cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'review_response':
        return <Star className="w-5 h-5 text-amber-600" />;
      case 'message_received':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'payment_received':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'property_liked':
        return <Star className="w-5 h-5 text-pink-600" />;
      default:
        return <Calendar className="w-5 h-5 text-slate-600" />;
    }
  };



  const getRelativeTime = (date: Date | string) => {
    if (!mounted) return 'recently';
    const now = new Date();
    const eventDate = typeof date === 'string' ? new Date(date) : date;
    const diff = now.getTime() - eventDate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return eventDate.toLocaleDateString();
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-4 sm:px-6 py-4 border-b border-white/5">
        <h3 className="text-base sm:text-lg font-bold text-white">Recent Activity</h3>
      </div>

      {/* Activities List */}
      {displayActivities.length > 0 ? (
        <div className="relative z-10 divide-y divide-white/5">
          {displayActivities.map((activity, idx) => (
            <button
              key={activity.id}
              onClick={() => onActivityClick?.(activity)}
              className={`w-full text-left px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/5 active:bg-white/10 transition-colors flex gap-3 sm:gap-4 items-start focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/50 ${activity.link ? 'cursor-pointer' : ''
                }`}
              aria-label={`View ${activity.title}`}
            >
              {/* Timeline connector */}
              <div className="flex flex-col items-center gap-2 mt-1 flex-shrink-0">
                <div className="p-1.5 sm:p-2 bg-zinc-800/50 border border-white/10 rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                {idx !== displayActivities.length - 1 && (
                  <div className="w-0.5 h-10 sm:h-12 bg-gradient-to-b from-zinc-600 to-transparent" />
                )}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-xs sm:text-sm mb-1 line-clamp-1">{activity.title}</h4>
                <p className="text-zinc-400 text-xs sm:text-sm line-clamp-2">{activity.description}</p>
                <p className="text-zinc-500 text-xs mt-1 sm:mt-2">{getRelativeTime(activity.timestamp)}</p>
              </div>

              {/* Action Link */}
              {activity.link && (
                <div className="text-blue-400 font-semibold text-sm sm:text-base whitespace-nowrap ml-2 flex-shrink-0" aria-hidden="true">→</div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="relative z-10 px-4 sm:px-6 py-6 sm:py-8 text-center">
          <p className="text-zinc-500 text-xs sm:text-sm">No activities yet</p>
        </div>
      )}

      {/* View All Link */}
      {activities.length > maxItems && (
        <Link
          href="/dashboard/notifications"
          className="relative z-10 block px-4 sm:px-6 py-2.5 sm:py-3 text-center text-blue-400 hover:bg-white/5 active:bg-white/10 border-t border-white/5 font-medium text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/50"
        >
          View All Activities →
        </Link>
      )}
    </div>
  );
}
