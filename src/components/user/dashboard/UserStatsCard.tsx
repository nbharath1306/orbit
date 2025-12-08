'use client';

import React from 'react';
import { Calendar, Heart, DollarSign, Star, MessageSquare, PenTool } from 'lucide-react';

interface UserStatsCardProps {
  stats: {
    activeBookings?: number;
    savedProperties?: number;
    totalSpent?: number;
    monthlySpent?: number;
    averageRating?: number;
    unreadMessages?: number;
    pendingReviews?: number;
  };
  onStatClick?: (stat: string) => void;
}

interface StatCard {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  hoverColor: string;
}

export default function UserStatsCard({ stats, onStatClick }: UserStatsCardProps) {
  const statCards: StatCard[] = [
    {
      label: 'Active Bookings',
      value: stats.activeBookings || 0,
      icon: <Calendar className="w-6 h-6" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      hoverColor: 'hover:bg-blue-100',
    },
    {
      label: 'Saved Properties',
      value: stats.savedProperties || 0,
      icon: <Heart className="w-6 h-6" />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      hoverColor: 'hover:bg-purple-100',
    },
    {
      label: 'Total Spent',
      value: `₹${((stats.totalSpent || 0) / 100000).toFixed(1)}L`,
      subtext: stats.monthlySpent ? `This month: ₹${(stats.monthlySpent / 1000).toFixed(0)}K` : undefined,
      icon: <DollarSign className="w-6 h-6" />,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      hoverColor: 'hover:bg-amber-100',
    },
    {
      label: 'Avg Rating',
      value: (stats.averageRating || 0).toFixed(1),
      subtext: '/ 5.0',
      icon: <Star className="w-6 h-6" />,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      hoverColor: 'hover:bg-orange-100',
    },
    {
      label: 'Unread Messages',
      value: stats.unreadMessages || 0,
      icon: <MessageSquare className="w-6 h-6" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      hoverColor: 'hover:bg-green-100',
    },
    {
      label: 'Pending Reviews',
      value: stats.pendingReviews || 0,
      icon: <PenTool className="w-6 h-6" />,
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      hoverColor: 'hover:bg-pink-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
      {statCards.map((card, idx) => (
        <button
          key={idx}
          onClick={() => onStatClick?.(card.label.toLowerCase().replace(/\s+/g, '_'))}
          className="group text-left relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md transition-all duration-300 hover:bg-zinc-900/60 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 hover:border-white/10 p-6 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          aria-label={`View ${card.label}`}
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${card.bgColor} rounded-xl`}>
                <div className={card.textColor}>{card.icon}</div>
              </div>
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">METRIC</span>
            </div>
            <p className="text-zinc-400 text-sm font-medium mb-2">{card.label}</p>
            <p className="text-3xl lg:text-4xl font-bold text-white break-words">{card.value}</p>
            {card.subtext && <p className="text-zinc-500 text-xs mt-2 truncate">{card.subtext}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}
