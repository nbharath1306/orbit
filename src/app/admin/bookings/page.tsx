'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface Booking {
  _id: string;
  studentId?: { name: string; email: string };
  propertyId?: { title: string };
  amountPaid: number;
  status: string;
  createdAt: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = bookings.filter(
    (b) =>
      b.studentId?.name.toLowerCase().includes(search.toLowerCase()) ||
      b.propertyId?.title.toLowerCase().includes(search.toLowerCase()) ||
      b.studentId?.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const totalRevenue = bookings
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.amountPaid, 0);

  const stats = [
    { label: 'Total Bookings', value: bookings.length },
    { label: 'Paid Bookings', value: bookings.filter((b) => b.status === 'paid').length },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}` },
    { label: 'Average Booking', value: `₹${Math.round(totalRevenue / bookings.length || 0).toLocaleString()}` },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bookings Management</h1>
          <p className="text-zinc-400 mt-1">View and manage all bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
            <p className="text-zinc-500 text-sm mb-2 font-medium uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <Input
          placeholder="Search by student name, email, or property..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 transition-colors text-white placeholder:text-zinc-600"
        />
      </div>

      {/* Bookings Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">{filtered.length} Bookings</h2>
        </div>
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="text-left py-4 px-6 text-zinc-400 font-medium text-sm">Student</th>
                    <th className="text-left py-4 px-6 text-zinc-400 font-medium text-sm">Property</th>
                    <th className="text-left py-4 px-6 text-zinc-400 font-medium text-sm">Amount</th>
                    <th className="text-left py-4 px-6 text-zinc-400 font-medium text-sm">Status</th>
                    <th className="text-left py-4 px-6 text-zinc-400 font-medium text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((booking) => (
                    <tr key={booking._id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-white font-medium">{booking.studentId?.name || 'N/A'}</p>
                          <p className="text-zinc-500 text-sm">{booking.studentId?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-zinc-300">{booking.propertyId?.title || 'N/A'}</td>
                      <td className="py-4 px-6 text-white font-medium">
                        ₹{booking.amountPaid.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-zinc-500 text-sm">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
