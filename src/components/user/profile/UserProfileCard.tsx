'use client';

import React from 'react';
import { Mail, Phone, MapPin, Calendar, Badge } from 'lucide-react';

interface UserProfileCardProps {
  user: {
    name: string;
    email: string;
    image?: string;
    phone?: string;
    university?: string;
    createdAt: string;
    isVerified: boolean;
  };
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

export default function UserProfileCard({
  user,
  isOwnProfile = true,
  onEdit,
}: UserProfileCardProps) {
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      {/* Cover Photo */}
      <div className="relative h-32 bg-gradient-to-r from-blue-500/50 to-purple-500/50 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 px-6 pb-6">
        {/* Avatar */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 mb-6">
          <img
            src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
            alt={user.name}
            className="w-24 h-24 rounded-full border-4 border-zinc-800 shadow-lg ring-2 ring-blue-500/30"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              {user.isVerified && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✓ Verified</Badge>
              )}
            </div>
            <p className="text-zinc-400 mt-1">Member since {memberSince}</p>
          </div>
          {isOwnProfile && (
            <button
              onClick={onEdit}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium hover:shadow-lg hover:shadow-purple-500/50"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/10 pt-6">
          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium uppercase tracking-wide mb-1">Email</p>
              <p className="text-white font-semibold">{user.email}</p>
            </div>
          </div>

          {/* Phone */}
          {user.phone && (
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium uppercase tracking-wide mb-1">Phone</p>
                <p className="text-white font-semibold">{user.phone}</p>
              </div>
            </div>
          )}

          {/* University */}
          {user.university && (
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 font-medium uppercase tracking-wide mb-1">University</p>
                <p className="text-white font-semibold">{user.university}</p>
              </div>
            </div>
          )}

          {/* Member Since */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg text-green-400 border border-green-500/20">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium uppercase tracking-wide mb-1">Member Since</p>
              <p className="text-white font-semibold">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
