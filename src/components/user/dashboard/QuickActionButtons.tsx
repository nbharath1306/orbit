'use client';

import React from 'react';
import { Search, BookOpen, MessageSquare, Star } from 'lucide-react';

interface QuickActionButtonsProps {
  onAction?: (action: string) => void;
}

export default function QuickActionButtons({ onAction }: QuickActionButtonsProps) {
  const actions = [
    {
      id: 'search',
      label: 'Search Properties',
      icon: Search,
      description: 'Find your next stay',
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      id: 'booking',
      label: 'Make a Booking',
      icon: BookOpen,
      description: 'Start a new booking',
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'hover:from-emerald-600 hover:to-emerald-700',
    },
    {
      id: 'messages',
      label: 'Message Owner',
      icon: MessageSquare,
      description: 'Chat with property owners',
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'hover:from-purple-600 hover:to-purple-700',
    },
    {
      id: 'reviews',
      label: 'Write a Review',
      icon: Star,
      description: 'Share your experience',
      gradient: 'from-orange-500 to-orange-600',
      hoverGradient: 'hover:from-orange-600 hover:to-orange-700',
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-yellow-500/10 rounded-lg">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction?.(action.id)}
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md transition-all duration-300 hover:bg-zinc-900/60 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1 hover:border-white/10 p-6 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-left"
              aria-label={action.label}
            >
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              
              <div className="relative z-10">
                <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-xl mb-4 inline-flex`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-white">{action.label}</h3>
                  <svg className="w-5 h-5 text-white/40 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-xs text-zinc-400">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
