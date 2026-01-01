import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.role !== 'admin') {
    redirect('/auth/signin');
  }

  await dbConnect();

  // Get all reviews
  const reviews = await Review.find()
    .populate('studentId', 'name email')
    .populate('propertyId', 'title')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  // Get statistics
  const [statsByStatus, avgRatings] = await Promise.all([
    Review.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Review.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          avgCleanliness: { $avg: '$cleanliness' },
          avgCommunication: { $avg: '$communication' },
          avgAccuracy: { $avg: '$accuracy' },
          avgLocation: { $avg: '$location' },
          avgValue: { $avg: '$value' },
        },
      },
    ]),
  ]);

  const statusMap = statsByStatus.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {} as Record<string, number>);

  const avgData = avgRatings[0] || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Reviews Management</h1>
        <p className="text-zinc-400">Monitor and manage all property reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total" value={reviews.length} color="blue" />
        <StatCard label="Approved" value={statusMap['approved'] || 0} color="green" />
        <StatCard label="Pending" value={statusMap['pending'] || 0} color="orange" />
        <StatCard label="Flagged" value={statusMap['flagged'] || 0} color="red" />
        <StatCard
          label="Avg Rating"
          value={avgData.avgRating ? avgData.avgRating.toFixed(1) : '0'}
          color="purple"
        />
        <StatCard
          label="Verified"
          value={reviews.filter((r: any) => r.isVerifiedStay).length}
          color="green"
        />
      </div>

      {/* Reviews Table */}
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Reviewer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Property</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Verified</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reviews.map((review: any) => (
                <tr key={review._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {review.isAnonymous ? 'Anonymous' : review.studentId?.name || 'N/A'}
                      </p>
                      {!review.isAnonymous && (
                        <p className="text-xs text-zinc-500">{review.studentId?.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{review.propertyId?.title || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-yellow-400">
                        ⭐ {review.rating || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {review.isVerifiedStay ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        ✓ Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        review.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : review.status === 'pending'
                          ? 'bg-orange-500/20 text-orange-400'
                          : review.status === 'flagged'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-blue-400 hover:text-blue-300 transition">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <RatingCard label="Cleanliness" value={avgData.avgCleanliness} color="blue" />
        <RatingCard label="Communication" value={avgData.avgCommunication} color="green" />
        <RatingCard label="Accuracy" value={avgData.avgAccuracy} color="purple" />
        <RatingCard label="Location" value={avgData.avgLocation} color="orange" />
        <RatingCard label="Value" value={avgData.avgValue} color="red" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/20',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
  };

  const textColorMap: Record<string, string> = {
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };

  return (
    <div
      className={`p-4 rounded-lg border border-white/10 bg-gradient-to-br ${
        colorMap[color]
      } hover:border-white/20 transition-all`}
    >
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textColorMap[color]}`}>{value}</p>
    </div>
  );
}

function RatingCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const textColorMap: Record<string, string> = {
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 bg-white/10 rounded-full h-2">
          <div
            className={`h-full rounded-full ${textColorMap[color]}`}
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>
        <p className={`text-lg font-bold ${textColorMap[color]}`}>{value ? value.toFixed(1) : '0'}</p>
      </div>
    </div>
  );
}
