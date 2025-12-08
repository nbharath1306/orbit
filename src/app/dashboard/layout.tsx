import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import UserTopNav from '@/components/user/layout/UserTopNav';
import ErrorBoundary from '@/components/ErrorBoundary';

interface UserDashboardLayoutProps {
  children: ReactNode;
  unreadMessages?: number;
}

export default async function UserDashboardLayout({
  children,
  unreadMessages = 0,
}: UserDashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  // Check if user is logged in
  if (!session) {
    redirect('/api/auth/signin');
  }

  const userName = session.user?.name || 'User';
  const userAvatar = session.user?.image || undefined;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-zinc-100 selection:bg-white selection:text-black font-sans antialiased">
        {/* Background Effects */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Base Gradient */}
          <div className="absolute inset-0 bg-black" />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

          {/* Glowing Orbs - Blue/Purple theme for users */}
          <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse delay-1000" />
          <div className="absolute top-[40%] left-[60%] h-[300px] w-[300px] rounded-full bg-cyan-600/10 blur-[100px] animate-pulse delay-700" />

          {/* Noise Texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <UserTopNav
            unreadCount={unreadMessages}
            userName={userName}
            userAvatar={userAvatar}
          />
          <ErrorBoundary>
            <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
              <div className="container mx-auto max-w-7xl">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                  {children}
                </div>
              </div>
            </main>
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}
