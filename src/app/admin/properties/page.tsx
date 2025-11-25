'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, CheckCircle2, XCircle, Clock, MapPin, Home, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Property {
  _id: string;
  title: string;
  slug: string;
  address?: string;
  price?: { amount: number };
  approvalStatus: string;
  createdAt: string;
  ownerId?: { name: string; email: string };
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/properties');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveProperty(id: string) {
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: 'approved' }),
      });
      if (res.ok) {
        fetchProperties();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function rejectProperty(id: string) {
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: 'rejected' }),
      });
      if (res.ok) {
        fetchProperties();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const filtered = properties.filter((p) => {
    const matchesFilter = filter === 'all' || p.approvalStatus === filter;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.address?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: properties.length,
    approved: properties.filter(p => p.approvalStatus === 'approved').length,
    pending: properties.filter(p => p.approvalStatus === 'pending').length,
    rejected: properties.filter(p => p.approvalStatus === 'rejected').length,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Properties Management</h1>
          <p className="text-zinc-400 mt-1">Review and approve property listings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Properties', value: stats.total, icon: Home },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2 },
          { label: 'Pending Review', value: stats.pending, icon: Clock },
          { label: 'Rejected', value: stats.rejected, icon: XCircle },
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
            <label className="text-zinc-400 text-sm font-medium mb-2 block">Search Properties</label>
            <Input
              placeholder="Search by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 transition-colors text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-zinc-400 text-sm font-medium mb-2 block">Filter by Status</label>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
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

      {/* Properties Grid */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950 border border-zinc-800 rounded-xl">
            <Home className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">No properties found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((prop) => (
              <div
                key={prop._id}
                className="group relative bg-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all duration-300"
              >
                <div className="relative space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate line-clamp-2">
                        {prop.title}
                      </h3>
                      <p className="text-zinc-500 text-sm flex items-center gap-1.5 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{prop.address || 'No address'}</span>
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${prop.approvalStatus === 'approved'
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : prop.approvalStatus === 'rejected'
                          ? 'bg-red-500/10 border-red-500/20'
                          : 'bg-amber-500/10 border-amber-500/20'
                      }`}>
                      {prop.approvalStatus === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {prop.approvalStatus === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                      {prop.approvalStatus === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="pt-4 border-t border-zinc-900 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Price</span>
                      <div className="flex items-center gap-1 text-white font-semibold">
                        <span className="text-zinc-500 text-xs font-normal">INR</span>
                        {(prop.price?.amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Status</span>
                      <div className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-medium border ${prop.approvalStatus === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : prop.approvalStatus === 'rejected'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                        {(prop.approvalStatus || 'pending')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2">
                      <span className="text-zinc-500 text-xs">Added</span>
                      <span className="text-zinc-400 text-xs">{new Date(prop.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex flex-col gap-2">
                    {prop.approvalStatus === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveProperty(prop._id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-medium transition-all text-xs border border-emerald-500/20"
                          title="Approve property"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectProperty(prop._id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium transition-all text-xs border border-red-500/20"
                          title="Reject property"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                    <Link href={`/pg/${prop.slug}`} className="block">
                      <button className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium transition-all text-xs border border-zinc-800">
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
