'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, ShieldAlert, ShieldCheck, Mail, User, ArrowUpRight, ArrowDownLeft, Pin, PinOff } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  university?: string;
  isVerified: boolean;
  blacklisted: boolean;
  createdAt: string;
  isPinned?: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'student' | 'owner' | 'admin'>('all');
  const [pinnedUsers, setPinnedUsers] = useState<string[]>([]);

  // Modal states
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function blacklistUser(id: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blacklist: true, reason: blacklistReason || 'No reason provided' }),
      });
      if (res.ok) {
        fetchUsers();
        setShowBlacklistModal(false);
        setBlacklistReason('');
        setSelectedUserId(null);
        setSuccessMessage('User blacklisted successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        alert('Failed to blacklist user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error blacklisting user');
    }
  }

  function openBlacklistModal(id: string) {
    setSelectedUserId(id);
    setBlacklistReason('');
    setShowBlacklistModal(true);
  }

  async function unblacklistUser(id: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blacklist: false }),
      });
      if (res.ok) {
        fetchUsers();
        setSuccessMessage('User unblocked successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        alert('Failed to unblock user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error unblocking user');
    }
  }

  async function verifyUser(id: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verify: true }),
      });
      if (res.ok) {
        fetchUsers();
        setSuccessMessage('User verified successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        alert('Failed to verify user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error verifying user');
    }
  }

  async function unverifyUser(id: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verify: false }),
      });
      if (res.ok) {
        fetchUsers();
        setSuccessMessage('User unverified successfully!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        alert('Failed to unverify user');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating user');
    }
  }

  const togglePin = (userId: string) => {
    setPinnedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filtered = users.filter((u) => {
    const matchesFilter = filter === 'all' || u.role === filter;
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sort: pinned first, then admins/owners, then students
  const sortedUsers = filtered.sort((a, b) => {
    const aPinned = pinnedUsers.includes(a._id) ? 0 : 1;
    const bPinned = pinnedUsers.includes(b._id) ? 0 : 1;
    if (aPinned !== bPinned) return aPinned - bPinned;

    const roleOrder = { admin: 0, owner: 1, student: 2 };
    const aRole = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
    const bRole = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
    return aRole - bRole;
  });

  const stats = {
    total: users.length,
    verified: users.filter(u => u.isVerified).length,
    students: users.filter(u => u.role === 'student').length,
    owners: users.filter(u => u.role === 'owner').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-zinc-400 mt-1">Monitor and manage platform users</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: User },
          { label: 'Verified', value: stats.verified, icon: CheckCircle2 },
          { label: 'Students', value: stats.students, icon: ArrowDownLeft },
          { label: 'Owners', value: stats.owners, icon: ArrowUpRight },
          { label: 'Admins', value: stats.admins, icon: ShieldCheck },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Metric</span>
              </div>
              <p className="text-3xl font-bold text-white tracking-tight mb-1">{stat.value}</p>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-zinc-400 text-sm font-medium mb-2 block">Search Users</label>
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 transition-colors text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-zinc-400 text-sm font-medium mb-2 block">Filter by Role</label>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'student', 'owner', 'admin'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={`transition-all ${filter === f
                      ? 'bg-white text-black hover:bg-zinc-200 border-transparent'
                      : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950 border border-zinc-800 rounded-xl">
            <User className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedUsers.map((user) => (
              <div
                key={user._id}
                className="group relative bg-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all duration-300"
              >
                <div className="relative space-y-4">
                  {/* User Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0 border border-zinc-800">
                        <User className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{user.name}</h3>
                        <p className="text-zinc-500 text-sm flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(user.role === 'admin' || user.role === 'owner') && (
                        <button
                          onClick={() => togglePin(user._id)}
                          title={pinnedUsers.includes(user._id) ? 'Unpin user' : 'Pin user'}
                          className={`p-1.5 rounded-lg transition-colors ${pinnedUsers.includes(user._id)
                              ? 'text-yellow-500 bg-yellow-500/10'
                              : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900'
                            }`}
                        >
                          {pinnedUsers.includes(user._id) ? (
                            <Pin className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <PinOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <div className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-medium border ${user.role === 'admin'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : user.role === 'owner'
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                        {user.role}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="space-y-2 pt-4 border-t border-zinc-900">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Verification</span>
                      <div className="flex items-center gap-2">
                        {user.isVerified ? (
                          <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium bg-zinc-500/10 px-2 py-1 rounded-full">
                            <XCircle className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Status</span>
                      <div className="flex items-center gap-2">
                        {user.blacklisted ? (
                          <span className="flex items-center gap-1.5 text-red-500 text-xs font-medium bg-red-500/10 px-2 py-1 rounded-full">
                            <ShieldAlert className="w-3 h-3" /> Blacklisted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex gap-2">
                    {user.isVerified ? (
                      <button
                        onClick={() => unverifyUser(user._id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium transition-all text-xs border border-zinc-800"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Unverify
                      </button>
                    ) : (
                      <button
                        onClick={() => verifyUser(user._id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-medium transition-all text-xs border border-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                      </button>
                    )}
                    {user.blacklisted ? (
                      <button
                        onClick={() => unblacklistUser(user._id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium transition-all text-xs border border-zinc-800"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => openBlacklistModal(user._id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium transition-all text-xs border border-red-500/20"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Block
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Blacklist Reason Modal */}
        <Dialog open={showBlacklistModal} onOpenChange={setShowBlacklistModal}>
          <DialogContent className="bg-zinc-950 border border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Blacklist User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-zinc-400 text-sm">
                Enter the reason for blacklisting this user. This will be logged in the audit trail.
              </p>
              <Input
                placeholder="E.g., Fraudulent activity, Policy violation..."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-red-500"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowBlacklistModal(false);
                  setBlacklistReason('');
                  setSelectedUserId(null);
                }}
                variant="outline"
                className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedUserId && blacklistUser(selectedUserId)}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                Blacklist User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="bg-zinc-950 border border-zinc-800 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center text-white">Success</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-6 text-center">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <p className="text-zinc-400 text-sm">{successMessage}</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
