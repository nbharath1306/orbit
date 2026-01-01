'use client';

import { Building2, MapPin, Users, DollarSign, Star, MoreVertical, Edit2, Trash2, Eye, BarChart3, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Property {
  _id: string;
  title: string;
  address?: string;
  location?: { address: string };
  price?: { amount: number };
  media?: { images: string[] };
  liveStats?: { occupiedRooms?: number; totalRooms?: number };
  sentimentTags?: string[];
  approvalStatus?: string;
  createdAt?: string;
}

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      setLoading(true);
      const res = await fetch('/api/owner/properties');
      if (!res.ok) throw new Error('Failed to fetch properties');
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProperties = filter === 'all' 
    ? properties 
    : properties.filter(p => (p.approvalStatus || 'active') === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Properties</h1>
          <p className="text-zinc-400 mt-1">Manage your listings, availability, and pricing.</p>
        </div>
        <Link
          href="/owner/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add New Property
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'active', 'draft', 'inactive'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filter === status
                ? 'bg-white text-black'
                : 'bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && properties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-zinc-900/30 border border-white/5">
          <Building2 className="w-16 h-16 text-zinc-600 mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">No Properties Yet</h3>
          <p className="text-zinc-400 text-sm mb-6">Start by listing your first property</p>
          <Link
            href="/owner/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            List First Property
          </Link>
        </div>
      )}

      {/* Properties Grid */}
      {!loading && properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const imageUrl = property.media?.images?.[0] || 'https://placehold.co/600x400/09090b/3b82f6?text=Property';
            const address = property.location?.address || property.address || 'Address not specified';
            const occupancy = property.liveStats?.occupiedRooms || 0;
            const totalRooms = property.liveStats?.totalRooms || 10;
            const occupancyRate = totalRooms > 0 ? (occupancy / totalRooms) * 100 : 0;
            
            return (
              <div
                key={property._id}
                className="group bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300"
              >
                {/* Image Section */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      property.approvalStatus === 'approved' 
                        ? 'bg-emerald-500 text-black' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      {property.approvalStatus || 'pending'}
                    </span>
                  </div>

                  {/* Quick Stats Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div>
                      <h3 className="text-white font-bold text-lg truncate">{property.title}</h3>
                      <div className="flex items-center gap-1 text-zinc-300 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Occupancy</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">
                          {occupancy}/{totalRooms}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${occupancyRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Price (Mo)</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-medium">
                          ₹{(property.price?.amount || 0) / 1000}k
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  {/* Sentiment Tags */}
                  {property.sentimentTags && property.sentimentTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {property.sentimentTags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-zinc-500 text-xs">
                      Created {new Date(property.createdAt || '').toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/owner/properties/${property._id}/edit`}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/property/${property._id}`}
                        target="_blank"
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="View Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Card (Empty State) */}
          <Link
            href="/owner/properties/new"
            className="group flex flex-col items-center justify-center gap-4 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl p-6 hover:bg-white/5 hover:border-emerald-500/50 transition-all duration-300 min-h-[380px]"
          >
            <div className="p-4 rounded-full bg-zinc-800 group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400 transition-colors">
              <Plus className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-medium mb-1">Add New Property</h3>
              <p className="text-sm text-zinc-500">List a new PG or Hostel</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
