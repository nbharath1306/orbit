import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import UserLayoutContent from '@/components/user/layout/UserLayoutContent';

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  return (
    <UserLayoutContent
      title="Saved Properties"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Saved Properties' },
      ]}
    >
      <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative z-10">
          <div className="text-5xl mb-4">❤️</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Saved Properties Yet</h3>
          <p className="text-zinc-400 mb-6">
            Start exploring and save properties to your wishlist!
          </p>
          <a
            href="/search"
            className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all hover:shadow-lg hover:shadow-purple-500/50"
          >
            Browse Properties
          </a>
        </div>
      </div>
    </UserLayoutContent>
  );
}
