import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import UserLayoutContent from '@/components/user/layout/UserLayoutContent';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  return (
    <UserLayoutContent
      title="Settings"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings' },
      ]}
    >
      <div className="grid gap-6">
        {/* Account Settings */}
        <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Account Settings</h3>
            <div className="space-y-4 text-zinc-400">
              <p>✓ Email preferences</p>
              <p>✓ Password management</p>
              <p>✓ Phone verification</p>
              <p>✓ Account deactivation</p>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Privacy & Security</h3>
            <div className="space-y-4 text-zinc-400">
              <p>✓ Profile visibility</p>
              <p>✓ Data sharing preferences</p>
              <p>✓ Cookie settings</p>
              <p>✓ Two-factor authentication</p>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-4">Notifications</h3>
            <div className="space-y-4 text-zinc-400">
              <p>✓ Email notifications</p>
              <p>✓ SMS alerts</p>
              <p>✓ In-app notifications</p>
              <p>✓ Booking updates</p>
            </div>
          </div>
        </div>
      </div>
    </UserLayoutContent>
  );
}
