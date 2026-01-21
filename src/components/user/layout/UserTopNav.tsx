'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Settings, User, Bell, MessageSquare, Calendar, Heart, Star, CreditCard, Menu, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';

interface UserTopNavProps {
  unreadCount?: number;
  userName?: string;
  userAvatar?: string;
}

export default function UserTopNav({ unreadCount = 0, userName = 'User', userAvatar }: UserTopNavProps) {
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState(unreadCount);
  const settingsRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  // Fetch unread count periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/messages/unread-count');
        if (res.ok) {
          const data = await res.json();
          setLiveUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: null },
    { name: 'Bookings', path: '/dashboard/bookings', icon: Calendar },
    { name: 'Saved', path: '/dashboard/saved', icon: Heart },
    { name: 'Reviews', path: '/dashboard/reviews', icon: Star },
    { name: 'Messages', path: '/dashboard/messages', icon: MessageSquare, badge: liveUnreadCount },
  ];

  return (
    <nav className="sticky top-4 z-50 mx-4 transition-all duration-300 mb-8">
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full group-hover:bg-blue-500/40 transition-all" />
                <Logo showText={false} iconClassName="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight flex flex-col leading-none hidden sm:flex">
                Orbit
                <span className="text-[10px] text-blue-400 font-medium uppercase tracking-widest">Dashboard</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 relative flex items-center gap-2 ${isActive(item.path)
                  ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.name}
                {item.badge ? (
                  <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-600/80 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          {/* Right Section - Profile & Settings */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Settings Dropdown */}
            <div ref={settingsRef} className="relative hidden sm:block">
              <button
                onClick={() => setShowSettings(!showSettings)}
                onMouseEnter={() => setShowSettings(true)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${showSettings ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Settings className={`w-4 h-4 transition-transform duration-500 ${showSettings ? 'rotate-180' : ''}`} />
                <span className="text-sm font-medium">Settings</span>
              </button>

              {showSettings && (
                <div
                  className="absolute right-0 mt-4 w-64 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  onMouseLeave={() => setShowSettings(false)}
                >
                  <div className="p-2 space-y-1">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <User size={16} />
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard/notifications"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-all relative"
                    >
                      <Bell size={16} />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600/80 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/dashboard/analytics"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Star size={16} />
                      Analytics
                    </Link>
                    <Link
                      href="/dashboard/payments"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <CreditCard size={16} />
                      Payments
                    </Link>
                    <div className="border-t border-white/10 my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <Link
              href="/dashboard/profile"
              className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
            >
              <img
                src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div ref={mobileRef} className="md:hidden border-t border-white/10 bg-black/50 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(item.path)
                    ? 'text-white bg-white/10'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-white/10 my-2" />
              <Link
                href="/dashboard/profile"
                className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                onClick={() => setShowMobileMenu(false)}
              >
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                onClick={() => setShowMobileMenu(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
