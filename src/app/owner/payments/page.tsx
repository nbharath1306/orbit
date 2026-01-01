'use client';

export default function OwnerPaymentsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Payments & Settlements</h1>
        <p className="text-zinc-400">Track your earnings and payment history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
          <p className="text-sm text-zinc-400 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-emerald-400">₹0</p>
          <p className="text-xs text-zinc-500 mt-2">This month</p>
        </div>

        <div className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-blue-500/20 to-blue-600/10">
          <p className="text-sm text-zinc-400 mb-1">Pending</p>
          <p className="text-3xl font-bold text-blue-400">₹0</p>
          <p className="text-xs text-zinc-500 mt-2">Awaiting settlement</p>
        </div>

        <div className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-purple-500/20 to-purple-600/10">
          <p className="text-sm text-zinc-400 mb-1">Settled</p>
          <p className="text-3xl font-bold text-purple-400">₹0</p>
          <p className="text-xs text-zinc-500 mt-2">Total settled</p>
        </div>
      </div>

      <div className="p-6 rounded-lg border border-white/10 bg-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">Payment History</h2>
        <div className="text-center py-12 text-zinc-500">
          <p>No payments yet</p>
        </div>
      </div>

      <div className="p-6 rounded-lg border border-white/10 bg-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">Bank Account</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-zinc-400 mb-1">Account Status</p>
            <p className="text-emerald-400">✓ Verified</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400 mb-1">Settlement Schedule</p>
            <p className="text-white">Every 5th of the month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
