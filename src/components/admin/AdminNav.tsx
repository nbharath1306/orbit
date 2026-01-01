'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings, ChevronUp, ChevronDown, User, Shield, Eye, Database, Key, Search } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || 'Admin';
  const userEmail = session?.user?.email || '';

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
    <nav className={`sticky top-4 z-50 mx-4 transition-all duration-300 ${isMinimized ? 'mb-4' : 'mb-8'}`}>
      <div className="bg-gradient-to-r from-zinc-900/70 via-zinc-900/60 to-zinc-900/70 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-full group-hover:bg-purple-500/50 transition-all duration-300" />
                <Logo showText={false} iconClassName="w-9 h-9 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
              {!isMinimized && (
                <span className="font-bold text-white text-xl tracking-tight flex flex-col leading-none">
                  Orbit
                  <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-widest">Admin Panel</span>
                </span>
              )}
            </Link>

            {!isMinimized && (
              <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-white/5 to-white/10 rounded-full p-1.5 border border-white/10 backdrop-blur-xl shadow-lg">
                {[
                  { name: 'Dashboard', path: '/admin' },
                  { name: 'Properties', path: '/admin/properties' },
                  { name: 'Users', path: '/admin/users' },
                  { name: 'Bookings', path: '/admin/bookings' },
                  { name: 'Analytics', path: '/admin/analytics' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 relative ${
                      isActive(item.path)
                        ? 'text-white bg-gradient-to-r from-purple-500/30 to-purple-600/20 shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-purple-500/30'
                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isMinimized && (
              <>
                {/* Search Button */}
                <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all hidden sm:flex group">
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>

                {/* User Profile */}
                <Link 
                  href="/admin/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all group"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`}
                    alt={userName}
                    className="w-8 h-8 rounded-full ring-2 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all"
                  />
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-white">{userName}</p>
                    <p className="text-[10px] text-zinc-400">Administrator</p>
                  </div>
                </Link>
                {/* Settings Dropdown */}
                <div ref={settingsRef} className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    onMouseEnter={() => setShowSettings(true)}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${
                      showSettings ? 'bg-white/10 text-white ring-2 ring-purple-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Settings className={`w-5 h-5 transition-all duration-700 ${
                      showSettings ? 'rotate-180 scale-110' : ''
                    }`} />
                  </button>

                  {showSettings && (
                    <div
                      className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-zinc-950/95 to-black/95 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-2xl"
                      onMouseLeave={() => setShowSettings(false)}
                    >
                      <div className="p-2 space-y-1">
                        {[
                          { icon: User, label: 'User Profile', path: '/admin/profile' },
                          { icon: Shield, label: 'Blacklisted Users', path: '/admin/blacklisted-users' },
                          { icon: Eye, label: 'Audit Logs', path: '/admin/audit-logs' },
                          { icon: Database, label: 'System Settings', path: '/admin/system-settings' },
                          { icon: Key, label: 'API Keys', path: '/admin/api-keys' },
                        ].map((item) => (
                          <button
                            key={item.path}
                            onClick={() => {
                              router.push(item.path);
                              setShowSettings(false);
                            }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-purple-600/5 transition-all rounded-xl text-left text-sm group"
                          >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/20 transition-colors">
                              <item.icon className="w-4 h-4 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="p-2 border-t border-white/5">
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all rounded-xl text-left text-sm group"
                        >
                          <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </div>
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              {isMinimized ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
