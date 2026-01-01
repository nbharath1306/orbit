import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Review from '@/models/Review';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.role !== 'admin') {
    redirect('/auth/signin');
  }

  await dbConnect();

  // Get dashboard stats
  const [
    totalBookings,
    totalReviews,
    pendingBookings,
    flaggedReviews,
    recentAuditLogs,
    topProperties,
    userCount,
  ] = await Promise.all([
    Booking.countDocuments(),
    Review.countDocuments(),
    Booking.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'flagged' }),
    AuditLog.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Review.aggregate([
      { $group: { _id: '$propertyId', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'properties', localField: '_id', foreignField: '_id', as: 'property' } },
    ]),
    User.countDocuments(),
  ]);

  // Calculate revenue from paid bookings only
  const revenueData = await Booking.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amountPaid' } } },
  ]);

  const totalRevenue = revenueData[0]?.total || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-zinc-400 text-lg">Manage bookings, reviews, and monitor system activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={totalBookings}
          change={`${pendingBookings} pending`}
          color="blue"
          icon="📋"
        />
        <StatCard
          label="Total Reviews"
          value={totalReviews}
          change={`${flaggedReviews} flagged`}
          color="purple"
          icon="⭐"
        />
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          change="From paid bookings"
          color="green"
          icon="💰"
        />
        <StatCard
          label="Active Users"
          value={userCount}
          change="total registered"
          color="orange"
          icon="👥"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white">Recent Bookings</h2>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {/* Bookings will be rendered here */}
                  <tr className="hover:bg-white/5 transition-colors">
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      Loading bookings...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Properties */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Top Properties</h2>
          <div className="space-y-3">
            {topProperties.map((prop: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {prop.property?.[0]?.title || 'Unknown'}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {prop.count} bookings • ⭐ {prop.avgRating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <div className="divide-y divide-white/10">
            {recentAuditLogs.map((log: any, idx: number) => (
              <div key={idx} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-zinc-400">
                      {log.userId?.name?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {log.action}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {log.userId?.email} • {log.resourceType}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    log.status === 'success'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {log.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  change: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  icon: string;
}) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
  };

  const textColorMap = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };

  return (
    <div
      className={`p-6 rounded-2xl border bg-gradient-to-br ${
        colorMap[color]
      } hover:border-white/20 transition-all hover:scale-[1.02] duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-zinc-400">{label}</p>
          <p className={`text-3xl font-bold ${textColorMap[color]}`}>{value}</p>
          <p className="text-xs text-zinc-500">{change}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
