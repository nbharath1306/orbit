import { Users, Home, ShoppingCart, TrendingUp, BarChart3, Shield, Zap, Lock, User as UserIcon, CheckCircle2, Mail, ExternalLink, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/admin/ui/GlassCard';

async function getAdminStats() {
  try {
    await dbConnect();
    console.log('Fetching admin stats...');

    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const paidBookings = await Booking.countDocuments({ status: 'paid' });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);

    const thisMonthBookings = await Booking.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    const studentCount = await User.countDocuments({ role: 'student' });
    const ownerCount = await User.countDocuments({ role: 'owner' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    const stats = {
      totalUsers,
      studentCount,
      ownerCount,
      verifiedUsers,
      totalProperties,
      approvedProperties: await Property.countDocuments({ approvalStatus: 'approved' }),
      pendingProperties: await Property.countDocuments({ approvalStatus: 'pending' }),
      totalBookings,
      paidBookings,
      thisMonthBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
    };

    console.log('Admin stats fetched:', stats);
    return stats;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
}

async function getRecentActivity() {
  try {
    await dbConnect();

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'name email')
      .populate('propertyId', 'title')
      .lean();

    return recentBookings;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

export default async function AdminDashboard() {
  let stats;
  let error = null;
  const session = await getServerSession(authOptions);
  const adminUser = session?.user;

  try {
    stats = await getAdminStats();
  } catch (err) {
    error = 'Failed to load dashboard data';
    console.error('Dashboard error:', err);
  }

  const recentBookings = await getRecentActivity();

  if (!stats || error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-zinc-400 text-lg">{error || 'Failed to load dashboard data'}</p>
        <button className="mt-4 px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: `${stats.studentCount} students, ${stats.ownerCount} owners`,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Properties',
      value: stats.totalProperties,
      description: `${stats.approvedProperties} approved, ${stats.pendingProperties} pending`,
      icon: Home,
      color: 'purple',
    },
    {
      title: 'Bookings',
      value: stats.totalBookings,
      description: `${stats.paidBookings} paid, ${stats.thisMonthBookings} this month`,
      icon: ShoppingCart,
      color: 'emerald',
    },
    {
      title: 'Revenue',
      value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`,
      description: 'Total from paid bookings',
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  const services = [
    {
      title: 'User Management',
      description: 'Control user roles, verify accounts, and manage blacklists',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      title: 'Property Control',
      description: 'Approve, reject, or manage all properties on the platform',
      icon: Home,
      href: '/admin/properties',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      title: 'Booking Analytics',
      description: 'Track bookings, payments, and rental activities',
      icon: ShoppingCart,
      href: '/admin/bookings',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Performance Metrics',
      description: 'Detailed analytics and platform performance insights',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    {
      title: 'Security',
      description: 'Manage security settings and monitor platform safety',
      icon: Shield,
      href: '/admin/users',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      title: 'System Performance',
      description: 'Monitor system health and optimize platform resources',
      icon: Zap,
      href: '/admin',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight font-heading">Command Center</h1>
          <p className="text-zinc-400 text-lg">Platform overview and management controls</p>
        </div>

        {adminUser && (
          <GlassCard className="flex items-center gap-5 p-2.5 pr-8 cursor-pointer group rounded-full border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <div className="w-full h-full rounded-full overflow-hidden bg-black ring-4 ring-black">
                {adminUser.image ? (
                  <img src={adminUser.image} alt={adminUser.name || 'Admin'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <UserIcon className="w-6 h-6 text-zinc-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-white text-lg font-bold leading-tight group-hover:text-blue-400 transition-colors tracking-tight mb-1">
                {adminUser.name || 'Admin'}
              </p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-zinc-300 transition-colors">
                  Administrator
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, idx) => (
          <GlassCard
            key={idx}
            className="p-6 group hover:-translate-y-1"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-${stat.color}-500/20`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-white/5 px-2 py-1 rounded-full border border-white/5">Metric</span>
              </div>
              <p className="text-4xl font-bold text-white tracking-tight mb-2 font-heading">{stat.value}</p>
              <p className="text-sm text-zinc-400 font-medium">{stat.description}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Services Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 font-heading">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <Link key={idx} href={service.href} className="group block h-full">
              <GlassCard className="h-full p-6 relative overflow-hidden">
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent via-transparent to-${service.color.split('-')[1]}-500/10`} />

                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${service.bg} ${service.border} ${service.color} border group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors border border-white/5">
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors font-heading">{service.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{service.description}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 font-heading">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              Recent Bookings
            </h2>
            <Link href="/admin/bookings" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group">
              View All <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <GlassCard className="overflow-hidden">
            {recentBookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-500 font-medium">No bookings recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentBookings.map((booking: any) => (
                  <div key={booking._id.toString()} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                        <Home className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{booking.propertyId?.title || 'Unknown Property'}</p>
                        <p className="text-sm text-zinc-500">{booking.studentId?.name || 'Unknown Student'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-white font-mono">₹{booking.amountPaid.toLocaleString()}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1.5 text-[10px] uppercase tracking-wider border-0 px-2.5 py-0.5 ${booking.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                          booking.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-zinc-500/10 text-zinc-500'
                          }`}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3 font-heading">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            System Status
          </h2>
          <GlassCard className="p-6 space-y-6">
            {[
              { label: 'Database', status: 'Operational', color: 'emerald' },
              { label: 'API Gateway', status: 'Operational', color: 'emerald' },
              { label: 'Storage', status: 'Operational', color: 'emerald' },
              { label: 'Auth System', status: 'Operational', color: 'emerald' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">{item.label}</span>
                <span className={`flex items-center gap-2 text-xs font-bold text-${item.color}-500 bg-${item.color}-500/10 px-3 py-1 rounded-full border border-${item.color}-500/20`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-${item.color}-500 animate-pulse`}></span>
                  {item.status}
                </span>
              </div>
            ))}

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Last check</span>
                <span className="font-mono">Just now</span>
              </div>
            </div>
          </GlassCard>

          {/* Pro Tip Card */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/30" />
            <h3 className="text-white font-bold mb-2 relative z-10 font-heading">Pro Tip</h3>
            <p className="text-sm text-blue-200/80 relative z-10">
              Use <span className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/10">Cmd + K</span> to quickly access the command palette and navigate anywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
