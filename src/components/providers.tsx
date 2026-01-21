'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return <SessionProvider>{children}</SessionProvider>;
}
