import { useEffect, useState } from 'react';

/**
 * Custom hook to handle hydration safely
 * Returns false on server/initial render, true after client hydration
 * Prevents hydration mismatches
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

/**
 * Wrapper component for content that needs hydration protection
 */
export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return null;
  }

  return <>{children}</>;
}
