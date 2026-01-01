'use client';

export default function OwnerAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Analytics</h1>
        <p className="text-zinc-400">Coming soon - Detailed analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue Trends</h2>
          <div className="h-48 flex items-center justify-center text-zinc-500">
            <p>Chart coming soon</p>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">Occupancy Rate</h2>
          <div className="h-48 flex items-center justify-center text-zinc-500">
            <p>Chart coming soon</p>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">Top Properties</h2>
          <div className="h-48 flex items-center justify-center text-zinc-500">
            <p>Table coming soon</p>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">Student Feedback</h2>
          <div className="h-48 flex items-center justify-center text-zinc-500">
            <p>Data coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
