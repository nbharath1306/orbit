'use client';

import { Card } from '@/components/ui/card';
import {
  BookOpen,
  Star,
  DollarSign,
  Clock
} from 'lucide-react';

interface DashboardStatsProps {
  activeBookings: number;
  totalBookings: number;
  totalSpent: number;
  averageRating: number;
  totalReviews: number;
  pendingBookings: number;
}

export default function DashboardStats({
  activeBookings,
  totalBookings,
  totalSpent,
  averageRating,
  totalReviews,
  pendingBookings,
}: DashboardStatsProps) {
  const stats = [
    {
      icon: BookOpen,
      label: 'Active Bookings',
      value: activeBookings,
      color: 'blue',
      subtext: `${totalBookings} total`,
    },
    {
      icon: DollarSign,
      label: 'Total Spent',
      value: `₹${totalSpent.toLocaleString()}`,
      color: 'green',
      subtext: 'across all bookings',
    },
    {
      icon: Star,
      label: 'Your Rating',
      value: averageRating.toFixed(1),
      color: 'yellow',
      subtext: `${totalReviews} reviews`,
    },
    {
      icon: Clock,
      label: 'Pending Approval',
      value: pendingBookings,
      color: pendingBookings > 0 ? 'orange' : 'green',
      subtext: 'awaiting owner response',
    },
  ];

  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
  };

  const textColorMap = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card
            key={idx}
            className={`p-6 border border-white/10 bg-gradient-to-br ${colorMap[stat.color as keyof typeof colorMap]} hover:border-white/20 transition-all group cursor-default`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${textColorMap[stat.color as keyof typeof textColorMap]}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-zinc-500">{stat.subtext}</p>
              </div>
              <div className={`p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors`}>
                <Icon className={`w-5 h-5 ${textColorMap[stat.color as keyof typeof textColorMap]}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
