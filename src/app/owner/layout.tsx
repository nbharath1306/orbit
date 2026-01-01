import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OwnerNav } from '@/components/owner/OwnerNav';
import { SessionProvider } from '@/components/providers/SessionProvider';

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is logged in
  if (!session) {
    redirect('/api/auth/signin');
  }

  // Check if user is owner or admin
  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== 'owner' && role !== 'admin') {
    redirect('/');
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-black text-zinc-100 selection:bg-emerald-500 selection:text-black font-sans antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-black" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

        {/* Glowing Orbs - Emerald Theme */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-teal-600/20 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[60%] h-[300px] w-[300px] rounded-full bg-green-600/10 blur-[100px] animate-pulse delay-700" />

        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen pt-24">
        <OwnerNav />
        <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-7xl">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
    </SessionProvider>
  );
}
