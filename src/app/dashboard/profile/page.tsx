import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import UserLayoutContent from '@/components/user/layout/UserLayoutContent';
import UserProfileCard from '@/components/user/profile/UserProfileCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  try {
    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user) {
      redirect('/auth/signin');
    }

    return (
      <UserLayoutContent
        title="My Profile"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile' },
        ]}
        actions={
          <Link href="/dashboard/settings">
            <Button className="bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 hover:border-white/20">Settings</Button>
          </Link>
        }
      >
        <div className="grid gap-6">
          <UserProfileCard
            user={{
              name: user.name,
              email: user.email,
              image: user.image,
              phone: user.phone,
              university: user.university,
              createdAt: new Date().toISOString(),
              isVerified: user.isVerified,
            }}
            isOwnProfile={true}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              <div className="relative z-10">
                <p className="text-3xl font-bold text-blue-400 mb-2">0</p>
                <p className="text-zinc-400 text-sm">Bookings Completed</p>
              </div>
            </div>
            <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              <div className="relative z-10">
                <p className="text-3xl font-bold text-purple-400 mb-2">4.8</p>
                <p className="text-zinc-400 text-sm">Average Rating Given</p>
              </div>
            </div>
            <div className="relative rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              <div className="relative z-10">
                <p className="text-3xl font-bold text-cyan-400 mb-2">0</p>
                <p className="text-zinc-400 text-sm">Reviews Written</p>
              </div>
            </div>
          </div>
        </div>
      </UserLayoutContent>
    );
  } catch (error) {
    console.error('Error loading profile:', error);
    return (
      <UserLayoutContent title="My Profile">
        <div className="relative rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-md p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
          <p className="relative z-10 text-red-400">Error loading profile. Please try again.</p>
        </div>
      </UserLayoutContent>
    );
  }
}
