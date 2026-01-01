'use client';

import { useState } from 'react';
import { ArrowLeft, Bell, Shield, Eye, Lock, Mail, Globe, Palette } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function OwnerSettingsPage() {
  const [notifications, setNotifications] = useState({
    bookings: true,
    messages: true,
    reviews: true,
    marketing: false,
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showEmail: false,
    showPhone: false,
  });

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/10 hover:border-emerald-500/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent mb-2">
              Settings
            </h1>
            <p className="text-zinc-400 text-lg">Manage your preferences and account settings</p>
          </div>

          {/* Notifications */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Bell className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Notifications</h2>
                <p className="text-sm text-zinc-400">Manage how you receive notifications</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'bookings', label: 'Booking Updates', description: 'Get notified about new bookings and changes' },
                { key: 'messages', label: 'Messages', description: 'Receive alerts for new messages' },
                { key: 'reviews', label: 'Reviews', description: 'Get notified when guests leave reviews' },
                { key: 'marketing', label: 'Marketing', description: 'Receive tips and promotional content' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="text-sm text-zinc-400">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                    className={`relative w-12 h-6 rounded-full transition-all ${
                      notifications[item.key as keyof typeof notifications] ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Privacy</h2>
                <p className="text-sm text-zinc-400">Control your privacy settings</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'showProfile', label: 'Public Profile', description: 'Make your profile visible to students' },
                { key: 'showEmail', label: 'Show Email', description: 'Display email on your profile' },
                { key: 'showPhone', label: 'Show Phone', description: 'Display phone number on your profile' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="text-sm text-zinc-400">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                    className={`relative w-12 h-6 rounded-full transition-all ${
                      privacy[item.key as keyof typeof privacy] ? 'bg-blue-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        privacy[item.key as keyof typeof privacy] ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-900/30 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/owner/profile"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-emerald-500/20 transition-colors">
                  <Eye className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-white">Edit Profile</p>
                  <p className="text-sm text-zinc-400">Update your information</p>
                </div>
              </Link>

              <button className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 transition-all group">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-purple-500/20 transition-colors">
                  <Lock className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-white">Change Password</p>
                  <p className="text-sm text-zinc-400">Update your password</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 transition-all group">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500/20 transition-colors">
                  <Mail className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-white">Email Preferences</p>
                  <p className="text-sm text-zinc-400">Manage email settings</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 transition-all group">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-orange-500/20 transition-colors">
                  <Globe className="w-5 h-5 text-zinc-400 group-hover:text-orange-400 transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-white">Language & Region</p>
                  <p className="text-sm text-zinc-400">Set language preferences</p>
                </div>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-gradient-to-br from-red-950/20 to-red-900/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
            <div className="space-y-3">
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all group"
              >
                <div>
                  <p className="font-semibold text-red-400">Sign Out</p>
                  <p className="text-sm text-red-300/70">Sign out from your account</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-red-400 rotate-180" />
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all group">
                <div>
                  <p className="font-semibold text-red-400">Delete Account</p>
                  <p className="text-sm text-red-300/70">Permanently delete your account</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-red-400 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
