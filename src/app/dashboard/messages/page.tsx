import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import UserLayoutContent from '@/components/user/layout/UserLayoutContent';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  return (
    <UserLayoutContent
      title="Messages"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Messages' },
      ]}
    >
      <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative z-10">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Messages Yet</h3>
          <p className="text-zinc-400">
            Start a conversation with property owners when you make a booking!
          </p>
        </div>
      </div>
    </UserLayoutContent>
  );
}
