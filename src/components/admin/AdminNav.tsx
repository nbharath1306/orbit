'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings, ChevronUp, ChevronDown, User, Shield, Eye, Database, Key } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

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

  return (
    <nav className={`bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-50 transition-all duration-300 ${isMinimized ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2 group">
            <Logo showText={false} iconClassName="w-8 h-8 text-white group-hover:scale-105 transition-transform" />
            {!isMinimized && <span className="font-bold text-white text-lg tracking-tight">Orbit <span className="text-zinc-500 font-medium">Admin</span></span>}
          </Link>

          {!isMinimized && (
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/admin')
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/properties"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/admin/properties')
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
              >
                Properties
              </Link>
              <Link
                href="/admin/users"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/admin/users')
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
              >
                Users
              </Link>
              <Link
                href="/admin/bookings"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/admin/bookings')
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
              >
                Bookings
              </Link>
              <Link
                href="/admin/analytics"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/admin/analytics')
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
              >
                Analytics
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isMinimized && (
            <>
              {/* Settings Dropdown */}
              <div ref={settingsRef} className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  onMouseEnter={() => setShowSettings(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors text-sm font-medium"
                  title="Settings menu"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                {showSettings && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    onMouseLeave={() => setShowSettings(false)}
                  >
                    {/* User Profile */}
                    <button
                      onClick={() => {
                        router.push('/admin/profile');
                        setShowSettings(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-b border-zinc-900 text-left text-sm"
                    >
                      <User className="w-4 h-4" />
                      <span>User Profile</span>
                    </button>

                    {/* Blacklisted Users */}
                    <button
                      onClick={() => {
                        router.push('/admin/blacklisted-users');
                        setShowSettings(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-b border-zinc-900 text-left text-sm"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Blacklisted Users</span>
                    </button>

                    {/* Audit Logs */}
                    <button
                      onClick={() => {
                        router.push('/admin/audit-logs');
                        setShowSettings(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-b border-zinc-900 text-left text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Audit Logs</span>
                    </button>

                    {/* System Settings */}
                    <button
                      onClick={() => {
                        router.push('/admin/system-settings');
                        setShowSettings(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border-b border-zinc-900 text-left text-sm"
                    >
                      <Database className="w-4 h-4" />
                      <span>System Settings</span>
                    </button>

                    {/* API Keys */}
                    <button
                      onClick={() => {
                        router.push('/admin/api-keys');
                        setShowSettings(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors text-left text-sm"
                    >
                      <Key className="w-4 h-4" />
                      <span>API Keys</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors text-sm font-medium border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="inline-flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </nav>
  );
}
