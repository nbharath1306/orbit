'use client';



interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
}

export function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-lg p-6">
      <div className="flex flex-row items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        <div className="text-blue-500">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        {trend && (
          <p className={`text-xs font-semibold mt-2 ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
          </p>
        )}
      </div>
    </div>
  );
}

export function StatsGrid({ stats }: { stats: StatsCardProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatsCard key={i} {...stat} />
      ))}
    </div>
  );
}
