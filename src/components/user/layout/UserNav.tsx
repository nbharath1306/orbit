'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Heart,
  MessageSquare,
  Star,
  CreditCard,
  User,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';

interface UserNavProps {
  unreadCount?: number;
  userName?: string;
  userAvatar?: string;
  onNavigate?: (page: string) => void;
}

export default function UserNav({ unreadCount = 0, userName = 'User', userAvatar }: UserNavProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      label: 'My Bookings',
      href: '/dashboard/bookings',
      icon: Calendar,
      badge: 0,
    },
    {
      label: 'Saved Properties',
      href: '/dashboard/saved',
      icon: Heart,
      badge: 0,
    },
    {
      label: 'Messages',
      href: '/dashboard/messages',
      icon: MessageSquare,
      badge: unreadCount,
    },
    {
      label: 'Reviews',
      href: '/dashboard/reviews',
      icon: Star,
      badge: 0,
    },
    {
      label: 'Payments',
      href: '/dashboard/payments',
      icon: CreditCard,
      badge: 0,
    },
    {
      label: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      badge: 0,
    },
    {
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      badge: 0,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      badge: 0,
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-40 transition-all duration-300 md:z-50 ${
          isMinimized ? 'w-20' : 'w-64'
        } ${!isMobileOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
      >
        {/* Logo/Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          {!isMinimized && (
            <Link href="/dashboard" className="font-bold text-lg text-slate-900">
              Orbit
            </Link>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors hidden md:block"
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            {isMinimized ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-slate-200">
          <Link href="/dashboard/profile" className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors">
            <img
              src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
              alt={userName}
              className="w-10 h-10 rounded-full"
            />
            {!isMinimized && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500">View Profile</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  }`}
                  title={isMinimized ? item.label : ''}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isMinimized && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {item.badge > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {!isMinimized && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </nav>

      {/* Spacer for main content */}
      <div className={`hidden md:block ${isMinimized ? 'w-20' : 'w-64'} transition-all duration-300`} />
    </>
  );
}
