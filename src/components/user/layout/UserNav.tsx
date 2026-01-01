'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Menu,
  X,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Logo } from '@/components/ui/Logo';

interface UserNavProps {
  unreadCount?: number;
  userName?: string;
  userAvatar?: string;
  onNavigate?: (page: string) => void;
}

export default function UserNav({ unreadCount = 0, userName = 'User', userAvatar }: UserNavProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const settingsRef = useRef<HTMLDivElement>(null);

  const displayName = userName || session?.user?.name || 'User';
  const displayEmail = session?.user?.email || '';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 0,
    },
    {
      label: 'Bookings',
      href: '/dashboard/bookings',
      icon: Calendar,
      badge: 0,
    },
    {
      label: 'Saved',
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
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      badge: 0,
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-zinc-900/95 via-zinc-900/90 to-zinc-900/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/20">
      <div className="mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full group-hover:bg-blue-500/50 transition-all duration-300" />
            <Logo showText={false} iconClassName="w-9 h-9 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="hidden lg:flex flex-col leading-none">
            <span className="font-bold text-white text-xl tracking-tight">Orbit</span>
            <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">Student</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-white/5 to-white/10 rounded-full p-1.5 border border-white/10 backdrop-blur-xl shadow-lg overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap relative group ${
                isActive(item.href)
                  ? 'text-white bg-gradient-to-r from-blue-500/30 to-blue-600/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-500/30'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
              {item.badge > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search Button */}
          <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all hidden sm:flex group">
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* User Profile */}
          <Link 
            href="/dashboard/profile"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all group"
          >
            <img
              src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayEmail}`}
              alt={displayName}
              className="w-8 h-8 rounded-full ring-2 ring-blue-500/30 group-hover:ring-blue-500/50 transition-all"
            />
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-white">{displayName}</p>
              <p className="text-[10px] text-zinc-400">Student</p>
            </div>
          </Link>

          {/* Settings Dropdown */}
          <div ref={settingsRef} className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                showSettings ? 'bg-white/10 text-white ring-2 ring-blue-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className={`w-5 h-5 transition-all duration-700 ${
                showSettings ? 'rotate-180 scale-110' : ''
              }`} />
            </button>

            {showSettings && (
              <div
                className="absolute right-0 mt-3 w-60 bg-gradient-to-br from-zinc-950/95 to-black/95 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-2xl"
                onMouseLeave={() => setShowSettings(false)}
              >
                <div className="p-2 space-y-1">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-blue-600/5 transition-all group"
                    onClick={() => setShowSettings(false)}
                  >
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500/20 transition-colors">
                      <User className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <span className="font-medium">My Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-blue-600/5 transition-all group"
                    onClick={() => setShowSettings(false)}
                  >
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500/20 transition-colors">
                      <Settings className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <span className="font-medium">Settings</span>
                  </Link>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                      <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-white/10 bg-zinc-900/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'text-white bg-blue-500/20 border border-blue-500/30'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
